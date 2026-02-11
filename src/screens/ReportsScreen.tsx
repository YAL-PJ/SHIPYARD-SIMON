import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getSessionReports } from "../storage/progress";
import { RootStackParamList } from "../types/navigation";
import { SessionReportCard } from "../types/progress";

type Props = NativeStackScreenProps<RootStackParamList, "Reports">;

export const ReportsScreen = (_: Props) => {
  const [reports, setReports] = useState<SessionReportCard[]>([]);

  const loadReports = useCallback(async () => {
    const next = await getSessionReports();
    setReports(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReports();
    }, [loadReports]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Reports</Text>
      <Text style={styles.subtitle}>Each report captures what shifted and what to revisit next.</Text>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.meta}>
              {item.coach} • {item.source === "ai" ? "AI report" : "Fallback report"} • Confidence {Math.round(item.confidence * 100)}%
            </Text>
            <Text style={styles.sectionLabel}>Summary</Text>
            <Text style={styles.text}>{item.summary}</Text>
            <Text style={styles.sectionLabel}>Pattern</Text>
            <Text style={styles.text}>{item.pattern}</Text>
            <Text style={styles.sectionLabel}>Next check-in</Text>
            <Text style={styles.text}>{item.nextCheckInPrompt}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700", color: "#0f172a" },
  subtitle: { marginTop: 6, color: "#64748b", fontSize: 14, lineHeight: 20 },
  list: { gap: 12, paddingTop: 12, paddingBottom: 24 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 6,
  },
  meta: { color: "#64748b", fontWeight: "700", fontSize: 12, letterSpacing: 0.6 },
  sectionLabel: { color: "#334155", fontSize: 12, fontWeight: "700", letterSpacing: 0.4, marginTop: 2 },
  text: { color: "#0f172a", fontSize: 14, lineHeight: 20 },
});
