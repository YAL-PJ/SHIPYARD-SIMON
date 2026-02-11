import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import {
  archiveOutcomeCard,
  deleteOutcomeCard,
  getTimelineItems,
  updateOutcomeCard,
} from "../storage/progress";
import { RootStackParamList } from "../types/navigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SessionOutcomeCard, TimelineItem } from "../types/progress";

type Props = NativeStackScreenProps<RootStackParamList, "Progress">;

export const ProgressScreen = ({ navigation }: Props) => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    const timeline = await getTimelineItems();
    setItems(timeline);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems]),
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  };

  const renderOutcome = (outcome: SessionOutcomeCard) => {
    if (outcome.data.kind === "focus") {
      return (
        <>
          <Text style={styles.outcomeLabel}>Priority</Text>
          <TextInput
            style={styles.editableText}
            multiline
            value={outcome.data.priority}
            onChangeText={(value) =>
              void updateOutcomeCard(outcome.id, (current) =>
                current.data.kind !== "focus"
                  ? current
                  : { ...current, data: { ...current.data, priority: value } },
              )
            }
            onBlur={() => void loadItems()}
          />
          <Text style={styles.outcomeLabel}>First Step</Text>
          <TextInput
            style={styles.editableText}
            multiline
            value={outcome.data.firstStep}
            onChangeText={(value) =>
              void updateOutcomeCard(outcome.id, (current) =>
                current.data.kind !== "focus"
                  ? current
                  : { ...current, data: { ...current.data, firstStep: value } },
              )
            }
            onBlur={() => void loadItems()}
          />
          <TouchableOpacity
            style={styles.lightButton}
            onPress={() =>
              void updateOutcomeCard(outcome.id, (current) =>
                current.data.kind !== "focus"
                  ? current
                  : {
                      ...current,
                      data: { ...current.data, isCompleted: !current.data.isCompleted },
                    },
              ).then(loadItems)
            }
          >
            <Text style={styles.lightButtonText}>
              {outcome.data.isCompleted ? "✓ Completed" : "Mark completed"}
            </Text>
          </TouchableOpacity>
          {outcome.data.isCompleted ? (
            <View style={styles.subtlePrompt}>
              <Text style={styles.subtlePromptText}>
                Ready to choose what matters next?
              </Text>
              <TouchableOpacity
                style={styles.focusButton}
                onPress={() => navigation.navigate("Chat", { coach: "Focus Coach" })}
              >
                <Text style={styles.focusButtonText}>Start Focus Session</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      );
    }

    if (outcome.data.kind === "decision") {
      return (
        <>
          <Text style={styles.outcomeLabel}>Decision</Text>
          <TextInput
            style={styles.editableText}
            multiline
            value={outcome.data.decision}
            onChangeText={(value) =>
              void updateOutcomeCard(outcome.id, (current) =>
                current.data.kind !== "decision"
                  ? current
                  : { ...current, data: { ...current.data, decision: value } },
              )
            }
            onBlur={() => void loadItems()}
          />
          <Text style={styles.outcomeLabel}>Tradeoff Accepted</Text>
          <TextInput
            style={styles.editableText}
            multiline
            value={outcome.data.tradeoffAccepted}
            onChangeText={(value) =>
              void updateOutcomeCard(outcome.id, (current) =>
                current.data.kind !== "decision"
                  ? current
                  : { ...current, data: { ...current.data, tradeoffAccepted: value } },
              )
            }
            onBlur={() => void loadItems()}
          />
        </>
      );
    }

    return (
      <>
        <Text style={styles.outcomeLabel}>Insight</Text>
        <TextInput
          style={styles.editableText}
          multiline
          value={outcome.data.insight}
          onChangeText={(value) =>
            void updateOutcomeCard(outcome.id, (current) =>
              current.data.kind !== "reflection"
                ? current
                : { ...current, data: { ...current.data, insight: value } },
            )
          }
          onBlur={() => void loadItems()}
        />
        <Text style={styles.outcomeLabel}>Question to Carry</Text>
        <TextInput
          style={styles.editableText}
          multiline
          value={outcome.data.questionToCarry}
          onChangeText={(value) =>
            void updateOutcomeCard(outcome.id, (current) =>
              current.data.kind !== "reflection"
                ? current
                : { ...current, data: { ...current.data, questionToCarry: value } },
            )
          }
          onBlur={() => void loadItems()}
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Progress Timeline</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Reports")}>
            <Text style={styles.secondaryButtonText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("History")}> 
            <Text style={styles.secondaryButtonText}>Full history</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) =>
          item.type === "weekly-summary" ? (
            <View style={[styles.card, styles.weeklyCard]}>
              <Text style={styles.weeklyTag}>WEEKLY PATTERN</Text>
              <Text style={styles.weeklyText}>{item.summary.summary}</Text>
            </View>
          ) : item.type === "session-report" ? (
            <View style={[styles.card, styles.reportCard]}>
              <Text style={styles.reportTag}>SESSION REPORT</Text>
              <Text style={styles.meta}>{item.report.coach}</Text>
              <Text style={styles.reportLabel}>Summary</Text>
              <Text style={styles.weeklyText}>{item.report.summary}</Text>
              <Text style={styles.reportLabel}>Pattern</Text>
              <Text style={styles.weeklyText}>{item.report.pattern}</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.meta}>{item.outcome.coach}</Text>
              {renderOutcome(item.outcome)}
              <View style={styles.rowButtons}>
                <TouchableOpacity
                  style={styles.lightButton}
                  onPress={() => void archiveOutcomeCard(item.outcome.id).then(loadItems)}
                >
                  <Text style={styles.lightButtonText}>Archive</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={() =>
                    Alert.alert("Delete outcome?", "This cannot be undone.", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => void deleteOutcomeCard(item.outcome.id).then(loadItems),
                      },
                    ])
                  }
                >
                  <Text style={styles.dangerButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerActions: { flexDirection: "row", gap: 8 },
  title: { fontSize: 28, fontWeight: "700", color: "#0f172a" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: { color: "#334155", fontWeight: "600", fontSize: 13 },
  list: { gap: 12, paddingTop: 14, paddingBottom: 30 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 8,
  },
  weeklyCard: { backgroundColor: "#f1f5f9" },
  reportCard: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
  weeklyTag: { fontSize: 11, letterSpacing: 0.6, fontWeight: "700", color: "#475569" },
  weeklyText: { color: "#334155", lineHeight: 21 },
  reportTag: { fontSize: 11, letterSpacing: 0.6, fontWeight: "700", color: "#3730a3" },
  reportLabel: { color: "#4338ca", fontSize: 12, fontWeight: "700", letterSpacing: 0.4 },
  meta: { color: "#64748b", fontSize: 12, fontWeight: "700", letterSpacing: 0.6 },
  outcomeLabel: { color: "#334155", fontSize: 12, fontWeight: "700", letterSpacing: 0.4 },
  editableText: {
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    color: "#0f172a",
    minHeight: 44,
  },
  rowButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  lightButton: {
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  lightButtonText: { color: "#334155", fontSize: 13, fontWeight: "600" },
  dangerButton: {
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fef2f2",
  },
  dangerButtonText: { color: "#b91c1c", fontSize: 13, fontWeight: "600" },
  subtlePrompt: {
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    gap: 8,
  },
  subtlePromptText: { color: "#475569", fontSize: 13 },
  focusButton: {
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  focusButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
