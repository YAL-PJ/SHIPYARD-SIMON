import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";
import { EventMetric, getOutcomeQualityMetrics } from "../storage/insights";
import { getTrackedEvents, trackEvent } from "../storage/analytics";
import { syncAnalyticsEvents } from "../ai/openai";

type Props = NativeStackScreenProps<RootStackParamList, "Insights">;

export const InsightsScreen = (_: Props) => {
  const [metrics, setMetrics] = useState<EventMetric[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>("Not synced");

  const loadMetrics = useCallback(async () => {
    setMetrics(await getOutcomeQualityMetrics());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMetrics();
    }, [loadMetrics]),
  );

  const handleSync = async () => {
    const events = await getTrackedEvents();
    const accepted = await syncAnalyticsEvents(events);
    await trackEvent("analytics_synced", { accepted });
    setSyncStatus(`Synced ${accepted} events`);
    await loadMetrics();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quality Insights</Text>
      <Text style={styles.subtitle}>Internal signal checks for outcome quality and retention loops.</Text>
      <View style={styles.syncRow}>
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Text style={styles.syncButtonText}>Sync analytics to server</Text>
        </TouchableOpacity>
        <Text style={styles.syncStatus}>{syncStatus}</Text>
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
