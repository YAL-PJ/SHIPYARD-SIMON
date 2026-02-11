import AsyncStorage from "@react-native-async-storage/async-storage";

import { COACH_OPENING_MESSAGES, COACH_PROMPTS } from "../ai/prompts";
import { CoachLabel } from "../types/coaches";
import {
  CoachEditConfig,
  EditToneOption,
  EDIT_TONE_OPTIONS,
} from "../types/editCoach";

const STORAGE_KEY_PREFIX = "shipyard.editedCoach";

const MAX_GOAL_EMPHASIS_LENGTH = 120;
const MAX_CONSTRAINTS_LENGTH = 140;

const isToneOption = (value: unknown): value is EditToneOption =>
  typeof value === "string" &&
  EDIT_TONE_OPTIONS.includes(value as EditToneOption);

const getStorageKey = (coach: CoachLabel) => `${STORAGE_KEY_PREFIX}.${coach}`;

const normalizeText = (value: string, maxLength: number) =>
  value.trim().slice(0, maxLength);

const validateCoachEditConfig = (
  coach: CoachLabel,
  value: unknown,
): CoachEditConfig | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const config = value as Partial<CoachEditConfig>;

  if (
    config.coach !== coach ||
    typeof config.basePrompt !== "string" ||
    typeof config.baseOpeningMessage !== "string" ||
    typeof config.goalEmphasis !== "string" ||
    typeof config.constraints !== "string" ||
    !isToneOption(config.tone) ||
    typeof config.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    coach,
    basePrompt: config.basePrompt,
    baseOpeningMessage: config.baseOpeningMessage,
    goalEmphasis: normalizeText(config.goalEmphasis, MAX_GOAL_EMPHASIS_LENGTH),
    tone: config.tone,
    constraints: normalizeText(config.constraints, MAX_CONSTRAINTS_LENGTH),
    updatedAt: config.updatedAt,
  };
};

export const createCoachEditDraft = (coach: CoachLabel): CoachEditConfig => ({
  coach,
  basePrompt: COACH_PROMPTS[coach],
  baseOpeningMessage: COACH_OPENING_MESSAGES[coach],
  goalEmphasis: "",
  tone: "Grounded",
  constraints: "",
  updatedAt: new Date().toISOString(),
});

export const getCoachEditConfig = async (coach: CoachLabel) => {
  try {
    const rawValue = await AsyncStorage.getItem(getStorageKey(coach));

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    const validConfig = validateCoachEditConfig(coach, parsedValue);

    if (!validConfig) {
      await AsyncStorage.removeItem(getStorageKey(coach));
      return null;
    }

    return validConfig;
  } catch {
    return null;
  }
};

export const saveCoachEditConfig = async (config: CoachEditConfig) => {
  const normalizedConfig = {
    ...config,
    goalEmphasis: normalizeText(config.goalEmphasis, MAX_GOAL_EMPHASIS_LENGTH),
    constraints: normalizeText(config.constraints, MAX_CONSTRAINTS_LENGTH),
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    getStorageKey(config.coach),
    JSON.stringify(normalizedConfig),
  );

  return normalizedConfig;
};

export const getCoachEditInputLimits = () => ({
  maxGoalEmphasisLength: MAX_GOAL_EMPHASIS_LENGTH,
  maxConstraintsLength: MAX_CONSTRAINTS_LENGTH,
});

