const { readFileSync, existsSync } = require("node:fs");
const { mkdir, readFile, writeFile } = require("node:fs/promises");
const { createServer } = require("node:http");
const { join } = require("node:path");

require("dotenv").config();

const OpenAI = require("openai");

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0.2;
const MAX_TOKENS = 200;
const OUTCOME_MAX_TOKENS = 180;
const REPORT_MAX_TOKENS = 220;
const MAX_HISTORY_MESSAGES = 24;
const PORT = Number(process.env.PORT || 8787);
const ANALYTICS_DIR = join(__dirname, "data");
const ANALYTICS_FILE = join(ANALYTICS_DIR, "analytics-events.json");

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


const OUTCOME_SYSTEM_PROMPTS = {
  "Focus Coach": [
    "Extract a structured Focus outcome from the conversation.",
    "Return JSON only with keys: kind, priority, firstStep, isCompleted.",
    'Set kind to "focus" and isCompleted to false.',
    "priority and firstStep must each be one sentence.",
  ].join(" "),
  "Decision Coach": [
    "Extract a structured Decision outcome from the conversation.",
    "Return JSON only with keys: kind, decision, tradeoffAccepted.",
    'Set kind to "decision".',
    "decision and tradeoffAccepted must each be one sentence.",
  ].join(" "),
  "Reflection Coach": [
    "Extract a structured Reflection outcome from the conversation.",
    "Return JSON only with keys: kind, insight, questionToCarry.",
    'Set kind to "reflection".',
    "insight and questionToCarry must each be one sentence.",
  ].join(" "),
};

const normalizeSentence = (value, fallback) => {
  const normalized = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!normalized) {
    return fallback;
  }

  const capped = normalized.slice(0, 200);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
};


const extractLikelyJson = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) {
    return "";
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

const validateOutcome = (coach, parsedOutcome) => {
  if (!parsedOutcome || typeof parsedOutcome !== "object") {
    return null;
  }

  if (coach === "Focus Coach") {
    return {
      kind: "focus",
      priority: normalizeSentence(parsedOutcome.priority, "Choose one concrete priority for now."),
      firstStep: normalizeSentence(parsedOutcome.firstStep, "Take one concrete step in the next 20 minutes."),
      isCompleted: false,
    };
  }

  if (coach === "Decision Coach") {
    return {
      kind: "decision",
      decision: normalizeSentence(parsedOutcome.decision, "Commit to one direction."),
      tradeoffAccepted: normalizeSentence(parsedOutcome.tradeoffAccepted, "Accept one meaningful downside of this choice."),
    };
  }

  return {
    kind: "reflection",
    insight: normalizeSentence(parsedOutcome.insight, "Name what keeps recurring."),
    questionToCarry: normalizeSentence(parsedOutcome.questionToCarry, "What deserves a slower look this week?"),
  };
};

const getSessionOutcome = async ({ coach, messages }) => {
  const openai = getOpenAIClient();
  const conversationText = messages
    .filter(
      (message) =>
        message &&
        (message.role === "assistant" || message.role === "user") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        !message.isError,
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => `${message.role === "user" ? "User" : "Coach"}: ${message.content.trim()}`)
    .join("\n");

  const completionResponse = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: OUTCOME_MAX_TOKENS,
    messages: [
      { role: "system", content: OUTCOME_SYSTEM_PROMPTS[coach] },
      {
        role: "user",
        content: `Conversation:
${conversationText || "(empty)"}

Return JSON only.`,
      },
    ],
  });

  const raw = completionResponse.choices[0]?.message?.content?.trim() || "";
  if (!raw) {
    throw new HttpError(502, "Outcome extraction failed");
  }

  let parsed;
  const jsonCandidate = extractLikelyJson(raw);
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch {
    throw new HttpError(502, "Outcome extraction failed");
  }

  return validateOutcome(coach, parsed);
};

const REPORT_SYSTEM_PROMPT = [
  "Create a calm, factual coaching session report.",
  "Return JSON only with keys: summary, pattern, nextCheckInPrompt, confidence.",
  "summary, pattern, and nextCheckInPrompt must each be one sentence.",
  "confidence must be a number between 0 and 1.",
  "No hype, no diagnosis, no promises.",
].join(" ");

const normalizeConfidence = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0.5;
  }

  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
};

const getSessionReport = async ({ coach, messages, outcome }) => {
  const openai = getOpenAIClient();

  const conversationText = messages
    .filter(
      (message) =>
        message &&
        (message.role === "assistant" || message.role === "user") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        !message.isError,
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => `${message.role === "user" ? "User" : "Coach"}: ${message.content.trim()}`)
    .join("\n");

  const completionResponse = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: REPORT_MAX_TOKENS,
    messages: [
      { role: "system", content: REPORT_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          `Coach: ${coach}`,
          `Outcome JSON: ${JSON.stringify(outcome ?? {})}`,
          `Conversation:\n${conversationText || "(empty)"}`,
          "Return JSON only.",
        ].join("\n\n"),
      },
    ],
  });

  const raw = completionResponse.choices[0]?.message?.content?.trim() || "";
  if (!raw) {
    throw new HttpError(502, "Session report extraction failed");
  }

  const jsonCandidate = extractLikelyJson(raw);
  let parsed;
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch {
    throw new HttpError(502, "Session report extraction failed");
  }

  return {
    summary: normalizeSentence(parsed.summary, "You closed this session with a clear outcome."),
    pattern: normalizeSentence(
      parsed.pattern,
      "Pattern signal: you are building continuity through repeated coaching check-ins.",
    ),
    nextCheckInPrompt: normalizeSentence(
      parsed.nextCheckInPrompt,
      "At your next session, revisit what shifted after this outcome.",
    ),
    confidence: normalizeConfidence(parsed.confidence),
  };
};


const parseJsonArray = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const loadAnalyticsEvents = async () => {
  if (!existsSync(ANALYTICS_FILE)) {
    return [];
  }

  const raw = await readFile(ANALYTICS_FILE, "utf8");
  return parseJsonArray(raw);
};

const persistAnalyticsEvents = async (events) => {
  await mkdir(ANALYTICS_DIR, { recursive: true });
  await writeFile(ANALYTICS_FILE, JSON.stringify(events.slice(-2000), null, 2));
};

const summarizeAnalyticsEvents = (events) => {
  const names = [
    "session_saved",
    "session_closed",
    "outcome_extraction_result",
    "session_report_extraction_result",
    "report_feedback_submitted",
  ];

  const metrics = names.reduce((acc, name) => {
    acc[name] = events.filter((event) => event && event.name === name).length;
    return acc;
  }, {});

  return {
    total: events.length,
    metrics,
    latestEventAt: events[events.length - 1]?.createdAt || null,
  };
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
  const outcome = parsed.outcome && typeof parsed.outcome === "object" ? parsed.outcome : null;

  if (!COACH_LABELS.has(coach)) {
    throw new HttpError(400, "Invalid coach");
  }

  return { coach, messages, userContext, editedCoach, outcome };
};

createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "GET" && request.url === "/api/analytics-summary") {
    const events = await loadAnalyticsEvents();
    sendJson(response, 200, { summary: summarizeAnalyticsEvents(events) });
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  if (
    request.url !== "/api/coach-reply" &&
    request.url !== "/api/session-outcome" &&
    request.url !== "/api/session-report" &&
    request.url !== "/api/analytics-events"
  ) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  try {
    const rawBody = await readRequestBody(request);

    if (request.url === "/api/analytics-events") {
      let parsedBody;
      try {
        parsedBody = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        throw new HttpError(400, "Invalid JSON body");
      }

      const events = Array.isArray(parsedBody.events) ? parsedBody.events : [];
      const validEvents = events.filter(
        (event) =>
          event &&
          typeof event.name === "string" &&
          typeof event.id === "string" &&
          typeof event.createdAt === "string",
      );

      const existing = await loadAnalyticsEvents();
      const existingIds = new Set(existing.map((event) => event.id));
      const merged = [...existing];

      validEvents.forEach((event) => {
        if (!existingIds.has(event.id)) {
          merged.push(event);
          existingIds.add(event.id);
        }
      });

      await persistAnalyticsEvents(merged);

      if (process.env.NODE_ENV !== "production") {
        console.log(`[dev] analytics-events accepted=${validEvents.length} total=${merged.length}`);
      }

      sendJson(response, 200, {
        accepted: validEvents.length,
        totalStored: merged.length,
        summary: summarizeAnalyticsEvents(merged),
      });
      return;
    }

    const payload = parsePayload(rawBody);

    if (request.url === "/api/session-outcome") {
      const outcome = await getSessionOutcome(payload);
      sendJson(response, 200, { outcome });
      return;
    }

    if (request.url === "/api/session-report") {
      const report = await getSessionReport(payload);
      sendJson(response, 200, { report });
      return;
    }

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
