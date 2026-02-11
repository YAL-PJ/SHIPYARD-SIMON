import AsyncStorage from "@react-native-async-storage/async-storage";

import { getOutcomeCards } from "./progress";

const LAST_OPENED_KEY = "shipyard.engagement.lastOpenedAt";
const LAST_REMINDER_KEY = "shipyard.engagement.lastReminderAt";
const MS_IN_DAY = 24 * 60 * 60 * 1000;

export const markAppOpenedNow = async () => {
  await AsyncStorage.setItem(LAST_OPENED_KEY, new Date().toISOString());
};

export const maybeGetGentleReminder = async () => {
  const [lastOpenedRaw, lastReminderRaw, outcomes] = await Promise.all([
    AsyncStorage.getItem(LAST_OPENED_KEY),
    AsyncStorage.getItem(LAST_REMINDER_KEY),
    getOutcomeCards(),
  ]);

  if (outcomes.length < 3) {
    return null;
  }

  const now = Date.now();
  const lastOpened = lastOpenedRaw ? +new Date(lastOpenedRaw) : 0;
  const lastReminder = lastReminderRaw ? +new Date(lastReminderRaw) : 0;

  if (now - lastOpened < 7 * MS_IN_DAY) {
    return null;
  }

  if (lastReminder && now - lastReminder < 7 * MS_IN_DAY) {
    return null;
  }

  const recentOutcome = outcomes[0];
  if (!recentOutcome) {
    return null;
  }

  if (recentOutcome.data.kind === "decision") {
    return "You made a decision recently. Want to revisit it?";
  }

  if (recentOutcome.data.kind === "focus") {
    return "You paused after choosing one priority. Want to check in?";
  }

  return "You captured an insight recently. Want to check in?";
};

export const markReminderShownNow = async () => {
  await AsyncStorage.setItem(LAST_REMINDER_KEY, new Date().toISOString());
};
