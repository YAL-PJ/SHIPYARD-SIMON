import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";
import { EventMetric, getOutcomeQualityMetrics } from "../storage/insights";

type Props = NativeStackScreenProps<RootStackParamList, "Insights">;

export const InsightsScreen = (_: Props) => {
  const [metrics, setMetrics] = useState<EventMetric[]>([]);

  const loadMetrics = useCallback(async () => {
    setMetrics(await getOutcomeQualityMetrics());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMetrics();
    }, [loadMetrics]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quality Insights</Text>
      <Text style={styles.subtitle}>Internal signal checks for outcome quality and retention loops.</Text>
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
