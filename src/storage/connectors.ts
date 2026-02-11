import AsyncStorage from "@react-native-async-storage/async-storage";

export type ConnectorConfig = {
  id: "calendar";
  name: string;
  description: string;
  connected: boolean;
  contextHint: string;
};

const CONNECTORS_KEY = "shipyard.portal.connectors";

const DEFAULT_CONNECTORS: ConnectorConfig[] = [
  {
    id: "calendar",
    name: "Calendar Connector",
    description: "Share a lightweight weekly constraint summary from your calendar.",
    connected: false,
    contextHint: "",
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

export const getConnectorContext = async () => {
  const connectors = await getConnectors();
  const active = connectors.filter((entry) => entry.connected && entry.contextHint.trim().length > 0);

  if (active.length === 0) {
    return "";
  }

  return [
    "Connected context sources:",
    ...active.map((entry) => `- ${entry.name}: ${entry.contextHint.trim()}`),
  ].join("\n");
};
