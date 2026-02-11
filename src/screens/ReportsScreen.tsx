import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getSessionReports, updateReportUsefulness } from "../storage/progress";
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

  const handleFeedback = async (
    reportId: string,
    feedback: "useful" | "not_useful",
  ) => {
    await updateReportUsefulness(reportId, feedback);
    await loadReports();
  };

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
              {item.coach} • {item.source === "ai" ? "AI report" : "Fallback report"} • Confidence {Math.round(item.confidence * 100)}% • {item.qualityStatus}
            </Text>
            <Text style={styles.sectionLabel}>Summary</Text>
            <Text style={styles.text}>{item.summary}</Text>
            <Text style={styles.sectionLabel}>Pattern</Text>
            <Text style={styles.text}>{item.pattern}</Text>
            <Text style={styles.sectionLabel}>Next check-in</Text>
            <Text style={styles.text}>{item.nextCheckInPrompt}</Text>
            <View style={styles.feedbackRow}>
              <Text style={styles.feedbackLabel}>Was this useful?</Text>
              <View style={styles.feedbackButtons}>
                <TouchableOpacity
                  style={[
                    styles.feedbackButton,
                    item.usefulnessFeedback === "useful" && styles.feedbackButtonActive,
                  ]}
                  onPress={() => handleFeedback(item.id, "useful")}
                >
                  <Text style={styles.feedbackButtonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.feedbackButton,
                    item.usefulnessFeedback === "not_useful" && styles.feedbackButtonActive,
                  ]}
                  onPress={() => handleFeedback(item.id, "not_useful")}
                >
                  <Text style={styles.feedbackButtonText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  meta: { color: "#64748b", fontWeight: "700", fontSize: 12, letterSpacing: 0.4 },
  sectionLabel: { color: "#334155", fontSize: 12, fontWeight: "700", letterSpacing: 0.4, marginTop: 2 },
  text: { color: "#0f172a", fontSize: 14, lineHeight: 20 },
  feedbackRow: { marginTop: 6, gap: 6 },
  feedbackLabel: { color: "#334155", fontSize: 12, fontWeight: "600" },
  feedbackButtons: { flexDirection: "row", gap: 8 },
  feedbackButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  feedbackButtonActive: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  feedbackButtonText: { color: "#0f172a", fontSize: 12, fontWeight: "600" },
});
