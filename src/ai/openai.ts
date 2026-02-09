import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { CoachLabel } from "../types/coaches";
import { ChatMessage } from "../types/chat";
import { buildSystemPrompt } from "./prompts";

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0.2;
const MAX_TOKENS = 200;

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "",
  dangerouslyAllowBrowser: true,
});

type OpenAIRequest = {
  coach: CoachLabel;
  messages: ChatMessage[];
  userContext?: string;
};

export const fetchCoachReply = async ({
  coach,
  messages,
  userContext,
}: OpenAIRequest) => {
  const systemPrompt = buildSystemPrompt(coach, userContext);
  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages
      .filter((message) => !message.isError)
      .map((message) => ({
        role: message.role,
        content: message.content,
      })),
  ];

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: chatMessages,
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
};
