import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";
import { EventMetric, getOutcomeQualityMetrics } from "../storage/insights";
import { getTrackedEvents, trackEvent } from "../storage/analytics";
import { fetchAnalyticsSummary, syncAnalyticsEvents } from "../ai/openai";
import { ANALYTICS_EVENT } from "../types/analytics";

type Props = NativeStackScreenProps<RootStackParamList, "Insights">;

export const InsightsScreen = (_: Props) => {
  const [metrics, setMetrics] = useState<EventMetric[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>("Not synced");
  const [serverSummary, setServerSummary] = useState<string>("Server summary unavailable");

  const loadMetrics = useCallback(async () => {
    setMetrics(await getOutcomeQualityMetrics());
    const summary = await fetchAnalyticsSummary();
    if (!summary) {
      setServerSummary("Server summary unavailable");
      return;
    }

    setServerSummary(
      `Save rate ${(summary.kpis?.outcomeSaveRate ?? 0) * 100}% • Focus completion ${(summary.kpis?.focusCompletionRate ?? 0) * 100}% • Report acceptance ${(summary.kpis?.reportQualityAcceptanceRate ?? 0) * 100}% • D7 ${summary.installs?.retainedD7 ?? 0} • D30 ${summary.installs?.retainedD30 ?? 0}`,
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMetrics();
    }, [loadMetrics]),
  );

  const handleSync = async () => {
    const events = await getTrackedEvents();
    const result = await syncAnalyticsEvents(events);
    await trackEvent(ANALYTICS_EVENT.ANALYTICS_SYNCED, {
      accepted: result.accepted,
      total_stored: result.totalStored,
    });
    setSyncStatus(`Synced ${result.accepted} events`);
    if (result.summary) {
      setServerSummary(
        `Save rate ${(result.summary.kpis?.outcomeSaveRate ?? 0) * 100}% • Focus completion ${(result.summary.kpis?.focusCompletionRate ?? 0) * 100}% • Report acceptance ${(result.summary.kpis?.reportQualityAcceptanceRate ?? 0) * 100}% • D7 ${result.summary.installs?.retainedD7 ?? 0} • D30 ${result.summary.installs?.retainedD30 ?? 0}`,
      );
    }
    await loadMetrics();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quality Dashboard</Text>
      <Text style={styles.subtitle}>Internal KPI checks for reliability, report quality, and retention.</Text>
      <View style={styles.syncRow}>
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Text style={styles.syncButtonText}>Sync analytics to server</Text>
        </TouchableOpacity>
        <Text style={styles.syncStatus}>{syncStatus}</Text>
        <Text style={styles.syncStatus}>{serverSummary}</Text>
      </View>
      <FlatList
        data={metrics}
        keyExtractor={(item) => item.label}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  title: { fontSize: 28, fontWeight: "700", color: "#0f172a" },
  subtitle: { color: "#475569", marginTop: 6, lineHeight: 20 },
  syncRow: { marginTop: 12, marginBottom: 4, gap: 6 },
  syncButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  syncButtonText: { color: "#0f172a", fontWeight: "600", fontSize: 13 },
  syncStatus: { color: "#64748b", fontSize: 12 },
  list: { paddingTop: 12, gap: 10 },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: { color: "#334155", fontWeight: "600" },
  value: { color: "#0f172a", fontWeight: "700" },
});
