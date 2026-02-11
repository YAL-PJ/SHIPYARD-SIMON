import AsyncStorage from "@react-native-async-storage/async-storage";
import { AnalyticsEventName, AnalyticsPayload } from "../types/analytics";

const ANALYTICS_KEY = "shipyard.analytics.events";
const ANALYTICS_INSTALL_ID_KEY = "shipyard.analytics.installId";
const MAX_EVENTS = 400;

export type AnalyticsEvent = {
  id: string;
  name: AnalyticsEventName;
  createdAt: string;
  payload?: AnalyticsPayload;
};

const createId = () =>
  `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getInstallId = async () => {
  const existing = await AsyncStorage.getItem(ANALYTICS_INSTALL_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = `install-${Math.random().toString(16).slice(2)}-${Date.now()}`;
  await AsyncStorage.setItem(ANALYTICS_INSTALL_ID_KEY, next);
  return next;
};

const parseEvents = (value: string | null) => {
  if (!value) {
    return [] as AnalyticsEvent[];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as AnalyticsEvent[]) : [];
  } catch {
    return [] as AnalyticsEvent[];
  }
};

export const trackEvent = async (
  name: AnalyticsEventName,
  payload?: AnalyticsPayload,
) => {
  try {
    const installId = await getInstallId();
    const existing = parseEvents(await AsyncStorage.getItem(ANALYTICS_KEY));
    const next: AnalyticsEvent = {
      id: createId(),
      name,
      createdAt: new Date().toISOString(),
      payload: {
        ...payload,
        install_id: installId,
      },
    };

    const merged = [next, ...existing].slice(0, MAX_EVENTS);
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(merged));
  } catch {
    // non-blocking
  }
};

export const getTrackedEvents = async () => {
  return parseEvents(await AsyncStorage.getItem(ANALYTICS_KEY));
};
