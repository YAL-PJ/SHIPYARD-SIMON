import React, { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getOutcomeCards } from "../storage/progress";
import { RootStackParamList } from "../types/navigation";
import { SessionOutcomeCard } from "../types/progress";

type Props = NativeStackScreenProps<RootStackParamList, "Progress">;

const formatMonth = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(isoDate),
  );

const extractOutcomeText = (outcome: SessionOutcomeCard) => {
  if (outcome.data.kind === "focus") {
    return {
      title: outcome.data.priority,
      detail: `Next step: ${outcome.data.firstStep}`,
    };
  }

  if (outcome.data.kind === "decision") {
    return {
      title: outcome.data.decision,
      detail: `Tradeoff accepted: ${outcome.data.tradeoffAccepted}`,
    };
  }

  return {
    title: outcome.data.insight,
    detail: `Carry forward: ${outcome.data.questionToCarry}`,
  };
};

const buildMonthlyPatternSummary = (outcomes: SessionOutcomeCard[]) => {
  if (outcomes.length === 0) {
    return "No sessions yet this month.";
  }

  const words = outcomes
    .flatMap((outcome) => {
      const payload = extractOutcomeText(outcome);
      return `${payload.title} ${payload.detail}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 5);
    })
    .filter((token) => !["tradeoff", "accepted", "carry", "forward", "session", "focus", "coach", "decision", "reflection"].includes(token));

  const counts = words.reduce<Record<string, number>>((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const themes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([word]) => word);

  if (themes.length === 0) {
    return `${outcomes.length} sessions captured. The pattern is becoming clearer with continued reflection.`;
  }

  return `${outcomes.length} sessions captured. Recurring themes: ${themes.join(" and ")}.`;
};

export const ProgressScreen = ({ navigation }: Props) => {
  const [outcomes, setOutcomes] = useState<SessionOutcomeCard[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    const nextOutcomes = await getOutcomeCards();
    setOutcomes(nextOutcomes.filter((entry) => !entry.archivedAt));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems]),
  );


  const totalSessions = outcomes.length;
  const milestone = totalSessions >= 10 ? `${Math.floor(totalSessions / 10) * 10} sessions completed` : null;

  const currentMonthOutcomes = useMemo(() => {
    const now = new Date();
    return outcomes.filter((entry) => {
      const date = new Date(entry.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [outcomes]);

  const monthlySummary = buildMonthlyPatternSummary(currentMonthOutcomes);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reflection timeline</Text>
      <Text style={styles.subtitle}>A private record of your decisions and clarity statements over time.</Text>

      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Session count</Text>
        <Text style={styles.statsValue}>{totalSessions}</Text>
        {milestone ? <Text style={styles.milestone}>{milestone}</Text> : null}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Monthly reflection summary</Text>
        <Text style={styles.summaryText}>{monthlySummary}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Home")}>
        <Text style={styles.primaryButtonText}>Start a new session</Text>
      </TouchableOpacity>

      <FlatList
        data={outcomes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const details = extractOutcomeText(item);
          return (
            <View style={styles.card}>
              <Text style={styles.meta}>{formatMonth(item.createdAt)} • {item.coach.replace(" Coach", "")}</Text>
              <Text style={styles.cardTitle}>{details.title}</Text>
              <Text style={styles.cardDetail}>{details.detail}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No sessions yet.</Text>
            <Text style={styles.emptyText}>When you complete your first session, it will appear here.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  title: { fontSize: 30, fontWeight: "700", color: "#0f172a", letterSpacing: -0.4 },
  subtitle: { color: "#475569", fontSize: 14, lineHeight: 20, marginTop: 4 },
  statsCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 3,
  },
  statsLabel: { color: "#64748b", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  statsValue: { color: "#0f172a", fontSize: 28, fontWeight: "700" },
  milestone: { color: "#334155", fontSize: 13 },
  summaryCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 5,
  },
  summaryLabel: { color: "#475569", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  summaryText: { color: "#0f172a", fontSize: 14, lineHeight: 20 },
  primaryButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  primaryButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  list: { gap: 10, paddingTop: 14, paddingBottom: 24 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 5,
  },
  meta: { color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
  cardTitle: { color: "#0f172a", fontSize: 15, lineHeight: 21, fontWeight: "600" },
  cardDetail: { color: "#334155", fontSize: 13, lineHeight: 19 },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 5,
  },
  emptyTitle: { color: "#0f172a", fontSize: 15, fontWeight: "700" },
  emptyText: { color: "#475569", fontSize: 13, lineHeight: 18 },
});
