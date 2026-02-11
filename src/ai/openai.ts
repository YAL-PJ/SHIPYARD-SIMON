import { ChatMessage } from "../types/chat";
import { CoachLabel } from "../types/coaches";
import { CoachEditConfig } from "../types/editCoach";

type OpenAIRequest = {
  coach: CoachLabel;
  messages: ChatMessage[];
  userContext?: string;
  editedCoach?: CoachEditConfig | null;
};

type CoachReplyResponse = {
  reply?: string;
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

export const fetchCoachReply = async ({
  coach,
  messages,
  userContext,
  editedCoach,
}: OpenAIRequest) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/coach-reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        coach,
        userContext,
        editedCoach,
        messages: messages
          .filter((message) => !message.isError)
          .slice(-MAX_HISTORY_MESSAGES),
      }),
    });

    if (!response.ok) {
      return "";
    }

    const body = (await response.json()) as CoachReplyResponse;
    const reply = body.reply?.trim() ?? "";

    return reply;
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
};
