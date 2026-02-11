import { CoachLabel } from "./coaches";

export const EDIT_TONE_OPTIONS = ["Grounded", "Direct", "Gentle"] as const;

export type EditToneOption = (typeof EDIT_TONE_OPTIONS)[number];

export type CoachEditConfig = {
  coach: CoachLabel;
  basePrompt: string;
  baseOpeningMessage: string;
  goalEmphasis: string;
  tone: EditToneOption;
  constraints: string;
  updatedAt: string;
};

