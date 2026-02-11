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
const EDIT_TONE_OPTIONS = new Set(["Grounded", "Direct", "Gentle"]);
const MAX_GOAL_EMPHASIS_LENGTH = 120;
const MAX_CONSTRAINTS_LENGTH = 140;

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

const normalizeTrimmedText = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const sanitizeEditedCoach = (coach, editedCoach) => {
  if (!editedCoach || typeof editedCoach !== "object") {
    return null;
  }

  if (editedCoach.coach !== coach) {
    return null;
  }

  if (!EDIT_TONE_OPTIONS.has(editedCoach.tone)) {
    return null;
  }

  return {
    goalEmphasis: normalizeTrimmedText(
      editedCoach.goalEmphasis,
      MAX_GOAL_EMPHASIS_LENGTH,
    ),
    tone: editedCoach.tone,
    constraints: normalizeTrimmedText(
      editedCoach.constraints,
      MAX_CONSTRAINTS_LENGTH,
    ),
  };
};

const buildPersonalizationBlock = (editedCoach) => {
  if (!editedCoach) {
    return "";
  }

  return [
    "# Personalization Additions",
    "Apply these preferences while preserving full coach identity and never-rules.",
    `Goal emphasis: ${editedCoach.goalEmphasis || "None"}`,
    `Tone preference: ${editedCoach.tone}`,
    `Constraint: ${editedCoach.constraints || "None"}`,
    "Do not change coach type, role, or constitutional constraints.",
  ].join("\n");
};

const buildSystemPrompt = (coach, userContext, editedCoach) => {
  const parts = [promptBundle.coachPrompts[coach]];
  const personalizationBlock = buildPersonalizationBlock(editedCoach);

  if (personalizationBlock) {
    parts.push(personalizationBlock);
  }

  parts.push(promptBundle.constitution);
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

const getOpenAIReply = async ({ coach, messages, userContext, editedCoach }) => {
  const openai = getOpenAIClient();
  const safeEditedCoach = sanitizeEditedCoach(coach, editedCoach);

  let systemPrompt;

  try {
    systemPrompt = buildSystemPrompt(coach, userContext, safeEditedCoach);
  } catch {
    systemPrompt = buildSystemPrompt(coach, userContext, null);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[dev] final-system-prompt", systemPrompt);
  }

  const chatMessages = [
    { role: "system", content: systemPrompt },
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
  const editedCoach =
    parsed.editedCoach && typeof parsed.editedCoach === "object"
      ? parsed.editedCoach
      : null;

  if (!COACH_LABELS.has(coach)) {
    throw new HttpError(400, "Invalid coach");
  }

  return { coach, messages, userContext, editedCoach };
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
