export type ChatRole = "assistant" | "user";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  isError?: boolean;
  isOpening?: boolean;
};
