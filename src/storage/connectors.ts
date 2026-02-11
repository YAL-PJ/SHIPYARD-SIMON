import AsyncStorage from "@react-native-async-storage/async-storage";

export type ConnectorConfig = {
  id: "calendar";
  name: string;
  description: string;
  connected: boolean;
  contextHint: string;
  externalSourceUrl: string;
  syncedSummary: string;
  lastSyncedAt: string | null;
};

const CONNECTORS_KEY = "shipyard.portal.connectors";
const SYNC_WINDOW_DAYS = 7;

const DEFAULT_CONNECTORS: ConnectorConfig[] = [
  {
    id: "calendar",
    name: "Calendar Connector",
    description: "Pull a lightweight weekly constraint summary from an external iCal feed URL.",
    connected: false,
    contextHint: "",
    externalSourceUrl: "",
    syncedSummary: "",
    lastSyncedAt: null,
  },
];

const parseConnectors = (value: string | null) => {
  if (!value) {
    return DEFAULT_CONNECTORS;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return DEFAULT_CONNECTORS;
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
        contextHint: typeof match.contextHint === "string" ? match.contextHint.slice(0, 220) : "",
        externalSourceUrl:
          typeof match.externalSourceUrl === "string" ? match.externalSourceUrl.trim().slice(0, 300) : "",
        syncedSummary:
          typeof match.syncedSummary === "string" ? match.syncedSummary.trim().slice(0, 320) : "",
        lastSyncedAt:
          typeof match.lastSyncedAt === "string" && match.lastSyncedAt.length > 0 ? match.lastSyncedAt : null,
      };
    });
  } catch {
    return DEFAULT_CONNECTORS;
  }
};

export const getConnectors = async () => {
  const raw = await AsyncStorage.getItem(CONNECTORS_KEY);
  return parseConnectors(raw);
};

const saveConnectors = async (connectors: ConnectorConfig[]) => {
  await AsyncStorage.setItem(CONNECTORS_KEY, JSON.stringify(connectors));
};

export const setConnectorConnected = async (connectorId: ConnectorConfig["id"], connected: boolean) => {
  const connectors = await getConnectors();
  const next = connectors.map((entry) =>
    entry.id === connectorId
      ? {
          ...entry,
          connected,
        }
      : entry,
  );

  await saveConnectors(next);
  return next;
};

export const setConnectorContextHint = async (
  connectorId: ConnectorConfig["id"],
  contextHint: string,
) => {
  const normalized = contextHint.trim().replace(/\s+/g, " ").slice(0, 220);
  const connectors = await getConnectors();

  const next = connectors.map((entry) =>
    entry.id === connectorId
      ? {
          ...entry,
          contextHint: normalized,
        }
      : entry,
  );

  await saveConnectors(next);
  return next;
};

export const setConnectorSourceUrl = async (
  connectorId: ConnectorConfig["id"],
  sourceUrl: string,
) => {
  const normalized = sourceUrl.trim().slice(0, 300);
  const connectors = await getConnectors();

  const next = connectors.map((entry) =>
    entry.id === connectorId
      ? {
          ...entry,
          externalSourceUrl: normalized,
        }
      : entry,
  );

  await saveConnectors(next);
  return next;
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
    return "Synced calendar has no events in the next 7 days.";
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

  if (!connector.externalSourceUrl) {
    return { ok: false as const, error: "Add an iCal URL before syncing." };
  }

  let response: Response;
  try {
    response = await fetch(connector.externalSourceUrl);
  } catch {
    return { ok: false as const, error: "Could not reach calendar source URL." };
  }

  if (!response.ok) {
    return { ok: false as const, error: `Calendar source returned HTTP ${response.status}.` };
  }

  const text = await response.text();
  if (!text.includes("BEGIN:VCALENDAR")) {
    return { ok: false as const, error: "Source did not return a valid iCal calendar." };
  }

  const events = parseCalendarEvents(text);
  const summary = buildCalendarSummary(events);
  const nowIso = new Date().toISOString();

  const next = connectors.map((entry) =>
    entry.id === "calendar"
      ? {
          ...entry,
          syncedSummary: summary,
          lastSyncedAt: nowIso,
        }
      : entry,
  );

  await saveConnectors(next);
  return { ok: true as const, summary, syncedAt: nowIso };
};

export const getConnectorContext = async () => {
  const connectors = await getConnectors();
  const active = connectors.filter((entry) => entry.connected);

  if (active.length === 0) {
    return "";
  }

  const lines = active.flatMap((entry) => {
    const chunks = [];

    if (entry.syncedSummary.trim().length > 0) {
      chunks.push(`- ${entry.name} sync: ${entry.syncedSummary.trim()}`);
    }

    if (entry.contextHint.trim().length > 0) {
      chunks.push(`- ${entry.name} user note: ${entry.contextHint.trim()}`);
    }

    return chunks;
  });

  if (lines.length === 0) {
    return "";
  }

  return ["Connected context sources:", ...lines].join("\n");
};
