const { readFileSync } = require("node:fs");
const { createServer } = require("node:http");
const { join } = require("node:path");

require("dotenv").config();

const OpenAI = require("openai");

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0.2;
const MAX_TOKENS = 200;
const MAX_HISTORY_MESSAGES = 24;
const PORT = Number(process.env.PORT || 8787);

const COACH_LABELS = new Set([
  "Focus Coach",
  "Decision Coach",
  "Reflection Coach",
]);

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const buildPromptBundle = () => {
  const docsDir = join(__dirname, "..", "docs");

  return {
    constitution: readFileSync(
      join(docsDir, "06_GLOBAL_COACHING_CONSTITUTION.md"),
      "utf8",
    ).trim(),
    coachPrompts: {
      "Focus Coach": readFileSync(
        join(docsDir, "07_FOCUS_COACH_PROMPT.md"),
        "utf8",
      ).trim(),
      "Decision Coach": readFileSync(
        join(docsDir, "08_DECISION_COACH_PROMPT.md"),
        "utf8",
      ).trim(),
      "Reflection Coach": readFileSync(
        join(docsDir, "09_REFLECTION_COACH_PROMPT.md"),
        "utf8",
      ).trim(),
    },
  };
};

const promptBundle = buildPromptBundle();

let openaiClient = null;

const getOpenAIClient = () => {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new HttpError(500, "Missing OPENAI_API_KEY");
  }

  openaiClient = new OpenAI({
    apiKey,
  });

  return openaiClient;
};

const buildSystemPrompt = (coach, userContext) => {
  const parts = [promptBundle.constitution, promptBundle.coachPrompts[coach]];
  const context = typeof userContext === "string" ? userContext.trim() : "";

  if (context.length > 0) {
    parts.push(`User context:\n${context}`);
  }

  return parts.join("\n\n");
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  response.end(JSON.stringify(payload));
};

const readRequestBody = (request) =>
  new Promise((resolve, reject) => {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;

      if (rawBody.length > 1024 * 1024) {
        reject(new HttpError(413, "Request too large"));
      }
    });

    request.on("end", () => resolve(rawBody));
    request.on("error", reject);
  });

const getOpenAIReply = async ({ coach, messages, userContext }) => {
  const openai = getOpenAIClient();
  const chatMessages = [
    { role: "system", content: buildSystemPrompt(coach, userContext) },
    ...messages
      .filter(
        (message) =>
          message &&
          (message.role === "assistant" || message.role === "user") &&
          typeof message.content === "string" &&
          message.content.trim().length > 0 &&
          !message.isError,
      )
      .slice(-MAX_HISTORY_MESSAGES)
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      })),
  ];

  try {
    const completionResponse = await openai.chat.completions.create({
      model: MODEL,
      messages: chatMessages,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    });

    return completionResponse.choices[0]?.message?.content?.trim() || "";
  } catch {
    throw new HttpError(502, "Coach reply failed");
  }
};

const parsePayload = (rawBody) => {
  if (!rawBody) {
    throw new HttpError(400, "Missing request body");
  }

  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }

  const coach = parsed.coach;
  const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
  const userContext =
    typeof parsed.userContext === "string" ? parsed.userContext : "";

  if (!COACH_LABELS.has(coach)) {
    throw new HttpError(400, "Invalid coach");
  }

  return { coach, messages, userContext };
};

createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/coach-reply") {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  try {
    const rawBody = await readRequestBody(request);
    const payload = parsePayload(rawBody);
    const reply = await getOpenAIReply(payload);

    sendJson(response, 200, { reply });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(response, error.statusCode, { error: error.message });
      return;
    }

    sendJson(response, 502, { error: "Coach reply failed" });
  }
}).listen(PORT, () => {
  console.log(`Coach proxy listening on port ${PORT}`);
});
