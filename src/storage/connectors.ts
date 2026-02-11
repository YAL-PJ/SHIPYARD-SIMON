import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConnectorConsentState, ConnectorSyncOrigin } from "../types/portal";

export type ConnectorConfig = {
  id: "calendar";
  name: string;
  description: string;
  connected: boolean;
  consentState: ConnectorConsentState;
  consentedAt: string | null;
  contextHint: string;
  externalSourceUrl: string;
  syncedSummary: string;
  syncOrigin: ConnectorSyncOrigin;
  syncError: string | null;
  lastSyncedAt: string | null;
};

const CONNECTORS_KEY = "shipyard.portal.connectors";
const SYNC_WINDOW_DAYS = 7;

const DEFAULT_CONNECTORS: ConnectorConfig[] = [
  {
    id: "calendar",
    name: "Calendar Connector",
    description: "Bring in your next-week schedule constraints so coaching advice stays realistic.",
    connected: false,
    consentState: "not_requested",
    consentedAt: null,
    contextHint: "",
    externalSourceUrl: "",
    syncedSummary: "",
    syncOrigin: "manual",
    syncError: null,
    lastSyncedAt: null,
  },
];

const parseConnectors = (value: string | null): ConnectorConfig[] => {
  if (!value) {
    return DEFAULT_CONNECTORS.map((entry) => ({ ...entry }));
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return DEFAULT_CONNECTORS.map((entry) => ({ ...entry }));
    }

    return DEFAULT_CONNECTORS.map((defaultEntry) => {
      const match = parsed.find(
        (entry) => entry && typeof entry === "object" && (entry as { id?: string }).id === defaultEntry.id,
      ) as Partial<ConnectorConfig> | undefined;

      if (!match) {
        return defaultEntry;
      }

      return {
        ...defaultEntry,
        connected: Boolean(match.connected),
        consentState: match.consentState === "granted" || match.consentState === "denied" ? match.consentState : "not_requested",
        consentedAt: typeof match.consentedAt === "string" && match.consentedAt.length > 0 ? match.consentedAt : null,
        contextHint: typeof match.contextHint === "string" ? match.contextHint.slice(0, 220) : "",
        externalSourceUrl:
          typeof match.externalSourceUrl === "string" ? match.externalSourceUrl.trim().slice(0, 300) : "",
        syncedSummary:
          typeof match.syncedSummary === "string" ? match.syncedSummary.trim().slice(0, 320) : "",
        syncOrigin: match.syncOrigin === "synced" ? "synced" : "manual",
        syncError: typeof match.syncError === "string" && match.syncError.trim().length > 0 ? match.syncError.trim().slice(0, 220) : null,
        lastSyncedAt:
          typeof match.lastSyncedAt === "string" && match.lastSyncedAt.length > 0 ? match.lastSyncedAt : null,
      };
    });
  } catch {
    return DEFAULT_CONNECTORS.map((entry) => ({ ...entry }));
  }
};

export const getConnectors = async () => {
  const raw = await AsyncStorage.getItem(CONNECTORS_KEY);
  return parseConnectors(raw);
};

const saveConnectors = async (connectors: ConnectorConfig[]) => {
  await AsyncStorage.setItem(CONNECTORS_KEY, JSON.stringify(connectors));
};

const updateConnector = async (
  connectorId: ConnectorConfig["id"],
  updater: (entry: ConnectorConfig) => ConnectorConfig,
) => {
  const connectors = await getConnectors();
  const next = connectors.map((entry) => (entry.id === connectorId ? updater(entry) : entry));
  await saveConnectors(next);
  return next;
};

export const setConnectorConsent = async (
  connectorId: ConnectorConfig["id"],
  consentState: ConnectorConsentState,
) => {
  const now = new Date().toISOString();
  return updateConnector(connectorId, (entry) => ({
    ...entry,
    consentState,
    consentedAt: consentState === "granted" ? now : entry.consentedAt,
    connected: consentState === "granted" ? entry.connected : false,
  }));
};

export const setConnectorConnected = async (connectorId: ConnectorConfig["id"], connected: boolean) => {
  return updateConnector(connectorId, (entry) => ({
    ...entry,
    connected: entry.consentState === "granted" ? connected : false,
    syncError: null,
  }));
};

export const setConnectorContextHint = async (
  connectorId: ConnectorConfig["id"],
  contextHint: string,
) => {
  const normalized = contextHint.trim().replace(/\s+/g, " ").slice(0, 220);
  return updateConnector(connectorId, (entry) => ({
    ...entry,
    contextHint: normalized,
    syncOrigin: normalized.length > 0 ? "manual" : entry.syncOrigin,
  }));
};

export const setConnectorSourceUrl = async (
  connectorId: ConnectorConfig["id"],
  sourceUrl: string,
) => {
  const normalized = sourceUrl.trim().slice(0, 300);
  return updateConnector(connectorId, (entry) => ({
    ...entry,
    externalSourceUrl: normalized,
  }));
};

const parseIcsDate = (value: string) => {
  const normalized = value.trim().replace(/Z$/, "");
  if (/^\d{8}$/.test(normalized)) {
    const year = Number(normalized.slice(0, 4));
    const month = Number(normalized.slice(4, 6)) - 1;
    const day = Number(normalized.slice(6, 8));
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  const dateTimeMatch = normalized.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (!dateTimeMatch) {
    return null;
  }

  const [, y, m, d, hh, mm, ss] = dateTimeMatch;
  return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss), 0);
};

type CalendarEvent = {
  startAt: Date;
  summary: string;
};

const parseCalendarEvents = (icsText: string) => {
  const rows = icsText.replace(/\r\n/g, "\n").split("\n");
  const events: CalendarEvent[] = [];

  let current: Partial<CalendarEvent> | null = null;

  rows.forEach((row) => {
    const line = row.trim();
    if (!line) {
      return;
    }

    if (line === "BEGIN:VEVENT") {
      current = {};
      return;
    }

    if (line === "END:VEVENT") {
      if (current?.startAt) {
        events.push({
          startAt: current.startAt,
          summary: typeof current.summary === "string" ? current.summary : "Event",
        });
      }
      current = null;
      return;
    }

    if (!current) {
      return;
    }

    if (line.startsWith("DTSTART")) {
      const value = line.split(":").slice(1).join(":");
      const parsed = parseIcsDate(value);
      if (parsed) {
        current.startAt = parsed;
      }
      return;
    }

    if (line.startsWith("SUMMARY")) {
      const value = line.split(":").slice(1).join(":").replace(/\\,/g, ",").replace(/\\n/g, " ");
      current.summary = value.slice(0, 120);
    }
  });

  return events;
};

const toDayKey = (date: Date) => date.toISOString().slice(0, 10);

const buildCalendarSummary = (events: CalendarEvent[]) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + SYNC_WINDOW_DAYS);

  const upcoming = events.filter((event) => event.startAt >= start && event.startAt <= end);
  if (upcoming.length === 0) {
    return "Calendar sync found no events in the next 7 days.";
  }

  const dayCounts = upcoming.reduce<Record<string, number>>((acc, event) => {
    const key = toDayKey(event.startAt);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const busyDays = Object.entries(dayCounts)
    .filter(([, count]) => count >= 4)
    .map(([day]) => day)
    .slice(0, 3);

  const topEvents = upcoming
    .slice(0, 3)
    .map((event) => `${event.summary} (${event.startAt.toDateString().slice(0, 10)})`)
    .join("; ");

  const busyText = busyDays.length
    ? `Meeting-heavy days: ${busyDays.join(", ")}.`
    : "No heavily stacked meeting days detected.";

  return `Calendar sync: ${upcoming.length} events in next 7 days. ${busyText} Near-term events: ${topEvents}.`;
};

export const syncCalendarConnector = async () => {
  const connectors = await getConnectors();
  const connector = connectors.find((entry) => entry.id === "calendar");

  if (!connector) {
    return { ok: false as const, error: "Calendar connector not available." };
  }

  if (connector.consentState !== "granted") {
    return { ok: false as const, error: "Grant connector consent before syncing." };
  }

  if (!connector.connected) {
    return { ok: false as const, error: "Connect calendar before syncing." };
  }

  if (!connector.externalSourceUrl) {
    return { ok: false as const, error: "Add an iCal URL before syncing." };
  }

  let response: Response;
  try {
    response = await fetch(connector.externalSourceUrl);
  } catch {
    await updateConnector("calendar", (entry) => ({ ...entry, syncError: "Could not reach calendar source URL." }));
    return { ok: false as const, error: "Could not reach calendar source URL." };
  }

  if (!response.ok) {
    const error = `Calendar source returned HTTP ${response.status}.`;
    await updateConnector("calendar", (entry) => ({ ...entry, syncError: error }));
    return { ok: false as const, error };
  }

  const text = await response.text();
  if (!text.includes("BEGIN:VCALENDAR")) {
    const error = "Source did not return a valid iCal calendar.";
    await updateConnector("calendar", (entry) => ({ ...entry, syncError: error }));
    return { ok: false as const, error };
  }

  const events = parseCalendarEvents(text);
  const summary = buildCalendarSummary(events);
  const nowIso = new Date().toISOString();

  await updateConnector("calendar", (entry) => ({
    ...entry,
    syncedSummary: summary,
    syncOrigin: "synced",
    syncError: null,
    lastSyncedAt: nowIso,
  }));

  return { ok: true as const, summary, syncedAt: nowIso };
};

export const disconnectConnector = async (connectorId: ConnectorConfig["id"]) => {
  return updateConnector(connectorId, (entry) => ({
    ...entry,
    connected: false,
    syncError: null,
  }));
};

export const getConnectorContext = async () => {
  const connectors = await getConnectors();
  const active = connectors.filter((entry) => entry.connected && entry.consentState === "granted");

  if (active.length === 0) {
    return "";
  }

  const lines = active.flatMap((entry) => {
    const chunks = [];

    if (entry.syncedSummary.trim().length > 0) {
      chunks.push(`- ${entry.name} synced context: ${entry.syncedSummary.trim()}`);
    }

    if (entry.contextHint.trim().length > 0) {
      chunks.push(`- ${entry.name} manual context: ${entry.contextHint.trim()}`);
    }

    return chunks;
  });

  if (lines.length === 0) {
    return "";
  }

  return ["Connected context sources:", ...lines].join("\n");
};
