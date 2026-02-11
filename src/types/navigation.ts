import { CoachLabel } from "./coaches";

export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Chat: { coach: CoachLabel; quickMode?: boolean };
  Paywall: { coach: CoachLabel; source?: "chat" | "edit" | "home" };
  EditCoach: { coach: CoachLabel };
  Progress: { reminderOutcomeId?: string } | undefined;
  History: undefined;
  Reports: undefined;
  Memory: undefined;
  Safety: undefined;
  Insights: undefined;
  Portal: undefined;
};
