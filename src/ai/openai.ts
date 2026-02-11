import { ChatMessage } from "../types/chat";
import { CoachLabel } from "../types/coaches";
import { CoachEditConfig } from "../types/editCoach";
import { SessionOutcomeData } from "../types/progress";

type OpenAIRequest = {
  coach: CoachLabel;
  messages: ChatMessage[];
  userContext?: string;
  editedCoach?: CoachEditConfig | null;
};

type CoachReplyResponse = {
  reply?: string;
};

type SessionOutcomeResponse = {
  outcome?: SessionOutcomeData;
};

type SessionReportResponse = {
  report?: {
    summary?: string;
    pattern?: string;
    nextCheckInPrompt?: string;
    confidence?: number;
  };
};

type AnalyticsSummary = {
  total?: number;
  latestEventAt?: string | null;
  metrics?: Record<string, number>;
};

type AnalyticsSyncResponse = {
  accepted?: number;
  totalStored?: number;
  summary?: AnalyticsSummary;
};

const DEFAULT_API_BASE_URL = "http://localhost:8787";
const MAX_HISTORY_MESSAGES = 24;
const REQUEST_TIMEOUT_MS = 30000;

const getApiBaseUrl = () => {
  const envValue = (
    globalThis as {
      process?: {
        env?: Record<string, string | undefined>;
      };
    }
  ).process?.env?.EXPO_PUBLIC_API_BASE_URL;

  if (!envValue || envValue.trim().length === 0) {
    return DEFAULT_API_BASE_URL;
  }

  return envValue.replace(/\/+$/, "");
};

const requestJson = async <T>(path: string, payload: unknown) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};


const requestGetJson = async <T>(path: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchCoachReply = async ({
  coach,
  messages,
  userContext,
  editedCoach,
}: OpenAIRequest) => {
  const body = await requestJson<CoachReplyResponse>("/api/coach-reply", {
    coach,
    userContext,
    editedCoach,
    messages: messages
      .filter((message) => !message.isError)
      .slice(-MAX_HISTORY_MESSAGES),
  });

  const reply = body?.reply?.trim() ?? "";
  return reply;
};

export const fetchSessionOutcome = async ({
  coach,
  messages,
}: {
  coach: CoachLabel;
  messages: ChatMessage[];
}) => {
  const body = await requestJson<SessionOutcomeResponse>("/api/session-outcome", {
    coach,
    messages: messages
      .filter((message) => !message.isError)
      .slice(-MAX_HISTORY_MESSAGES),
  });

  return body?.outcome ?? null;
};

export const fetchSessionReport = async ({
  coach,
  messages,
  outcome,
}: {
  coach: CoachLabel;
  messages: ChatMessage[];
  outcome: SessionOutcomeData;
}) => {
  const body = await requestJson<SessionReportResponse>("/api/session-report", {
    coach,
    outcome,
    messages: messages.filter((message) => !message.isError).slice(-MAX_HISTORY_MESSAGES),
  });

  if (!body?.report) {
    return null;
  }

  return {
    summary: body.report.summary?.trim() ?? "",
    pattern: body.report.pattern?.trim() ?? "",
    nextCheckInPrompt: body.report.nextCheckInPrompt?.trim() ?? "",
    confidence: typeof body.report.confidence === "number" ? body.report.confidence : 0.5,
  };
};


export const syncAnalyticsEvents = async (events: Array<{
  id: string;
  name: string;
  createdAt: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
}>) => {
  const body = await requestJson<AnalyticsSyncResponse>("/api/analytics-events", { events });
  return {
    accepted: body?.accepted ?? 0,
    totalStored: body?.totalStored ?? 0,
    summary: body?.summary ?? null,
  };
};

export const fetchAnalyticsSummary = async () => {
  const body = await requestGetJson<{ summary?: AnalyticsSummary }>("/api/analytics-summary");
  return body?.summary ?? null;
};
