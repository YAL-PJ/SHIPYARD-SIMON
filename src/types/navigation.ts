import { CoachLabel } from "./coaches";

export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Chat: { coach: CoachLabel };
  Paywall: { coach: CoachLabel };
};
