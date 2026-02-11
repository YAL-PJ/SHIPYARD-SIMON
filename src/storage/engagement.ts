import AsyncStorage from "@react-native-async-storage/async-storage";

import { CoachLabel } from "../types/coaches";
import { getOutcomeCards } from "./progress";

const LAST_OPENED_KEY = "shipyard.engagement.lastOpenedAt";
const LAST_REMINDER_KEY = "shipyard.engagement.lastReminderAt";
const PENDING_REMINDER_KEY = "shipyard.engagement.pendingReminder";
const SCHEDULED_REMINDER_KEY = "shipyard.engagement.scheduledReminder";
const MS_IN_DAY = 24 * 60 * 60 * 1000;

export type ReminderTarget = "focus_outcome" | "focus_checkin";

export type GentleReminder = {
  id: string;
  message: string;
  coach: CoachLabel;
  target: ReminderTarget;
  outcomeId?: string;
  scheduledFor: string;
};

const parseReminder = (value: string | null): GentleReminder | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as GentleReminder;
    if (!parsed?.id || !parsed?.coach || !parsed?.scheduledFor) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const markAppOpenedNow = async () => {
  await AsyncStorage.setItem(LAST_OPENED_KEY, new Date().toISOString());
};

export const maybeScheduleGentleReminder = async () => {
  const [lastOpenedRaw, lastReminderRaw, scheduledRaw, outcomes] = await Promise.all([
    AsyncStorage.getItem(LAST_OPENED_KEY),
    AsyncStorage.getItem(LAST_REMINDER_KEY),
    AsyncStorage.getItem(SCHEDULED_REMINDER_KEY),
    getOutcomeCards(),
  ]);

  if (outcomes.length < 3) {
    return null;
  }

  const now = Date.now();
  const lastOpened = lastOpenedRaw ? +new Date(lastOpenedRaw) : 0;
  const lastReminder = lastReminderRaw ? +new Date(lastReminderRaw) : 0;
  const scheduled = parseReminder(scheduledRaw);

  if (now - lastOpened < 7 * MS_IN_DAY) {
    return null;
  }

  if (lastReminder && now - lastReminder < 7 * MS_IN_DAY) {
    return null;
  }

  if (scheduled && +new Date(scheduled.scheduledFor) > now) {
    return scheduled;
  }

  const unresolvedFocus = outcomes.find(
    (entry) => entry.data.kind === "focus" && !entry.data.isCompleted && !entry.archivedAt,
  );
  const latest = outcomes[0];

  const message = unresolvedFocus
    ? "You made progress on a focus priority earlier. If it helps, we can continue from that point."
    : latest?.data.kind === "decision"
      ? "You made an important decision recently. We can do a brief, calm check-in when you're ready."
      : "You captured useful progress recently. A short focus check-in can help keep continuity.";

  const reminder: GentleReminder = {
    id: `reminder-${Date.now()}`,
    message,
    coach: "Focus Coach",
    target: unresolvedFocus ? "focus_outcome" : "focus_checkin",
    outcomeId: unresolvedFocus?.id,
    scheduledFor: new Date(now + 5 * 60 * 1000).toISOString(),
  };

  await AsyncStorage.setItem(SCHEDULED_REMINDER_KEY, JSON.stringify(reminder));
  return reminder;
};

export const getTriggeredReminder = async () => {
  const scheduled = parseReminder(await AsyncStorage.getItem(SCHEDULED_REMINDER_KEY));
  if (!scheduled) {
    return null;
  }

  if (+new Date(scheduled.scheduledFor) > Date.now()) {
    return null;
  }

  await AsyncStorage.multiSet([
    [PENDING_REMINDER_KEY, JSON.stringify(scheduled)],
    [SCHEDULED_REMINDER_KEY, ""],
  ]);

  return scheduled;
};

export const consumePendingReminder = async () => {
  const pending = parseReminder(await AsyncStorage.getItem(PENDING_REMINDER_KEY));
  if (!pending) {
    return null;
  }

  await AsyncStorage.removeItem(PENDING_REMINDER_KEY);
  return pending;
};

export const markReminderShownNow = async () => {
  await AsyncStorage.setItem(LAST_REMINDER_KEY, new Date().toISOString());
};
