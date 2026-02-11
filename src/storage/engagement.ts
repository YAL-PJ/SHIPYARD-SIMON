import AsyncStorage from "@react-native-async-storage/async-storage";

import { CoachLabel } from "../types/coaches";
import { getOutcomeCards } from "./progress";

const LAST_OPENED_KEY = "shipyard.engagement.lastOpenedAt";
const LAST_REMINDER_KEY = "shipyard.engagement.lastReminderAt";
const PENDING_REMINDER_KEY = "shipyard.engagement.pendingReminder";
const SCHEDULED_REMINDER_KEY = "shipyard.engagement.scheduledReminder";
const LAST_NOTIFICATION_ID_KEY = "shipyard.engagement.lastNotificationId";
const MS_IN_DAY = 24 * 60 * 60 * 1000;

type NotificationsModule = {
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
      shouldShowAlert: boolean;
    }>;
  }) => void;
  getPermissionsAsync: () => Promise<{ granted?: boolean }>;
  requestPermissionsAsync: () => Promise<{ granted?: boolean }>;
  scheduleNotificationAsync: (request: {
    content: { title: string; body: string; data?: Record<string, string> };
    trigger: { seconds: number };
  }) => Promise<string>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  getLastNotificationResponseAsync: () => Promise<{
    notification?: { request?: { content?: { data?: Record<string, string> } } };
  } | null>;
};

export type ReminderTarget = "focus_outcome" | "focus_checkin";

export type GentleReminder = {
  id: string;
  message: string;
  coach: CoachLabel;
  target: ReminderTarget;
  outcomeId?: string;
  scheduledFor: string;
  delivery: "local_notification" | "in_app";
};

let notificationsModule: NotificationsModule | null = null;

const getNotificationsModule = (): NotificationsModule | null => {
  if (notificationsModule) {
    return notificationsModule;
  }

  try {
    notificationsModule = require("expo-notifications") as NotificationsModule;
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowAlert: true,
      }),
    });
    return notificationsModule;
  } catch {
    return null;
  }
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

    return { ...parsed, delivery: parsed.delivery === "local_notification" ? "local_notification" : "in_app" };
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
    delivery: "in_app",
  };

  const notifications = getNotificationsModule();
  if (notifications) {
    const currentPermissions = await notifications.getPermissionsAsync();
    const nextPermissions = currentPermissions.granted
      ? currentPermissions
      : await notifications.requestPermissionsAsync();

    if (nextPermissions.granted) {
      const notificationId = await notifications.scheduleNotificationAsync({
        content: {
          title: "Gentle check-in",
          body: reminder.message,
          data: {
            reminderId: reminder.id,
            target: reminder.target,
            outcomeId: reminder.outcomeId ?? "",
          },
        },
        trigger: { seconds: 5 * 60 },
      });

      reminder.delivery = "local_notification";
      await AsyncStorage.setItem(LAST_NOTIFICATION_ID_KEY, notificationId);
    }
  }

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
  const notifications = getNotificationsModule();
  const notificationId = await AsyncStorage.getItem(LAST_NOTIFICATION_ID_KEY);
  await AsyncStorage.setItem(LAST_REMINDER_KEY, new Date().toISOString());
  await AsyncStorage.removeItem(LAST_NOTIFICATION_ID_KEY);

  if (notifications && notificationId) {
    await notifications.cancelScheduledNotificationAsync(notificationId).catch(() => null);
  }
};

export const consumeReminderFromNotificationTap = async () => {
  const notifications = getNotificationsModule();
  if (!notifications) {
    return null;
  }

  const response = await notifications.getLastNotificationResponseAsync().catch(() => null);
  const data = response?.notification?.request?.content?.data;
  if (!data?.reminderId || !data?.target) {
    return null;
  }

  const scheduled = parseReminder(await AsyncStorage.getItem(SCHEDULED_REMINDER_KEY));
  if (!scheduled || scheduled.id !== data.reminderId) {
    return null;
  }

  await AsyncStorage.multiSet([
    [PENDING_REMINDER_KEY, JSON.stringify(scheduled)],
    [SCHEDULED_REMINDER_KEY, ""],
  ]);

  return scheduled;
};
