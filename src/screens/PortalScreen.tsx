import React, { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";
import { getInstructionPacks, toggleInstructionPack } from "../storage/instructionPacks";
import {
  ConnectorConfig,
  disconnectConnector,
  getConnectors,
  setConnectorConnected,
  setConnectorConsent,
  setConnectorContextHint,
  setConnectorSourceUrl,
  syncCalendarConnector,
} from "../storage/connectors";
import { trackEvent } from "../storage/analytics";
import { ANALYTICS_EVENT } from "../types/analytics";

type Props = NativeStackScreenProps<RootStackParamList, "Portal">;

type PackRow = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export const PortalScreen = (_: Props) => {
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncFailed, setLastSyncFailed] = useState(false);

  const load = useCallback(async () => {
    const [nextPacks, nextConnectors] = await Promise.all([getInstructionPacks(), getConnectors()]);
    setPacks(nextPacks);
    setConnectors(nextConnectors);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleConsentToggle = async (connector: ConnectorConfig, value: boolean) => {
    if (value) {
      await trackEvent(ANALYTICS_EVENT.CALENDAR_CONNECT_REQUESTED);
      Alert.alert(
        "Calendar connector consent",
        "You are allowing KAVANAH to read your provided iCal feed and summarize schedule constraints for coaching context. You can disconnect anytime.",
        [
          {
            text: "Decline",
            style: "cancel",
            onPress: () => {
              void setConnectorConsent(connector.id, "denied").then(load);
            },
          },
          {
            text: "I consent",
            onPress: () => {
              void setConnectorConsent(connector.id, "granted").then(async () => {
                await setConnectorConnected(connector.id, true);
                await trackEvent(ANALYTICS_EVENT.CALENDAR_CONNECTED);
                await load();
              });
            },
          },
        ],
      );
      return;
    }

    await disconnectConnector(connector.id);
    await trackEvent(ANALYTICS_EVENT.CALENDAR_DISCONNECTED);
    await load();
  };

  const handleCalendarSync = async (retry = false) => {
    setIsSyncing(true);
    setLastSyncFailed(false);
    await trackEvent(ANALYTICS_EVENT.CALENDAR_SYNC_STARTED, { retry });

    const result = await syncCalendarConnector();

    if (!result.ok) {
      setLastSyncFailed(true);
      setSyncMessage(result.error);
      await trackEvent(ANALYTICS_EVENT.CALENDAR_SYNC_FAILED, { reason: result.error, retry });
      await load();
      setIsSyncing(false);
      return;
    }

    setSyncMessage(`Calendar synced at ${new Date(result.syncedAt).toLocaleString()}.`);
    await trackEvent(ANALYTICS_EVENT.CALENDAR_SYNC_SUCCEEDED, { summary: result.summary.slice(0, 140) });
    await load();
    setIsSyncing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advanced Portal</Text>
      <Text style={styles.subtitle}>
        Premium depth: persistent instruction packs and real connector context with explicit consent.
      </Text>

      <View style={styles.connectorSection}>
        <Text style={styles.connectorTitle}>Calendar connector</Text>
        <Text style={styles.connectorSubtitle}>
          Connect an iCal feed to inject synced schedule constraints. Manual notes stay separate.
        </Text>
        {connectors.map((connector) => (
          <View key={connector.id} style={styles.connectorCard}>
            <View style={styles.row}>
              <View style={styles.textWrap}>
                <Text style={styles.name}>{connector.name}</Text>
                <Text style={styles.description}>{connector.description}</Text>
                <Text style={styles.consentMeta}>Consent: {connector.consentState}</Text>
              </View>
              <Switch
                value={connector.connected}
                onValueChange={(value) => void handleConsentToggle(connector, value)}
              />
            </View>

            <TextInput
              style={styles.connectorInput}
              value={connector.externalSourceUrl}
              placeholder="iCal URL: https://example.com/calendar.ics"
              placeholderTextColor="#94a3b8"
              editable={connector.consentState === "granted"}
              onEndEditing={(event) =>
                void setConnectorSourceUrl(connector.id, event.nativeEvent.text).then(load)
              }
              onChangeText={(value) =>
                setConnectors((prev) =>
                  prev.map((entry) => (entry.id === connector.id ? { ...entry, externalSourceUrl: value } : entry)),
                )
              }
            />

            <TextInput
              style={styles.connectorInput}
              value={connector.contextHint}
              placeholder="Manual note (separate from synced context)."
              placeholderTextColor="#94a3b8"
              multiline
              onEndEditing={(event) =>
                void setConnectorContextHint(connector.id, event.nativeEvent.text).then(load)
              }
              onChangeText={(value) =>
                setConnectors((prev) =>
                  prev.map((entry) => (entry.id === connector.id ? { ...entry, contextHint: value } : entry)),
                )
              }
            />

            <Pressable style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]} disabled={isSyncing} onPress={() => void handleCalendarSync()}>
              <Text style={styles.syncButtonText}>{isSyncing ? "Syncing…" : "Sync calendar feed"}</Text>
            </Pressable>
            {lastSyncFailed ? (
              <Pressable style={styles.retryButton} disabled={isSyncing} onPress={() => void handleCalendarSync(true)}>
                <Text style={styles.retryButtonText}>Retry sync</Text>
              </Pressable>
            ) : null}

            {connector.lastSyncedAt ? (
              <Text style={styles.syncMeta}>Last synced: {new Date(connector.lastSyncedAt).toLocaleString()}</Text>
            ) : null}
            {connector.syncedSummary ? <Text style={styles.syncMeta}>Synced summary: {connector.syncedSummary}</Text> : null}
            {connector.contextHint ? <Text style={styles.syncMeta}>Manual note: {connector.contextHint}</Text> : null}
            {connector.syncError ? <Text style={styles.errorMeta}>Sync error: {connector.syncError}</Text> : null}
          </View>
        ))}

        {syncMessage ? <Text style={styles.syncNotice}>{syncMessage}</Text> : null}
      </View>

      <FlatList
        data={packs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.textWrap}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={(value) =>
                  void toggleInstructionPack(item.id, value).then(load)
                }
              />
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  title: { fontSize: 28, fontWeight: "700", color: "#0f172a" },
  subtitle: { marginTop: 8, color: "#475569", lineHeight: 20 },
  list: { gap: 12, paddingTop: 12, paddingBottom: 24 },

  connectorSection: { marginTop: 16, gap: 10 },
  connectorTitle: { color: "#0f172a", fontWeight: "700", fontSize: 16 },
  connectorSubtitle: { color: "#64748b", fontSize: 12, lineHeight: 18 },
  connectorCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 12,
    gap: 8,
  },
  connectorInput: {
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    fontSize: 13,
  },
  syncButton: {
    borderRadius: 10,
    backgroundColor: "#0f172a",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  syncButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 12 },
  syncButtonDisabled: { opacity: 0.7 },
  retryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  retryButtonText: { color: "#334155", fontWeight: "700", fontSize: 12 },
  consentMeta: { color: "#64748b", fontSize: 12, lineHeight: 16 },
  syncMeta: { color: "#475569", fontSize: 12, lineHeight: 18 },
  errorMeta: { color: "#b91c1c", fontSize: 12, lineHeight: 18 },
  syncNotice: { color: "#334155", fontSize: 12 },

  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 12,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  textWrap: { flex: 1, gap: 4 },
  name: { color: "#0f172a", fontWeight: "700", fontSize: 15 },
  description: { color: "#475569", lineHeight: 19, fontSize: 13 },
});
