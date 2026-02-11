import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getSessionHistory } from "../storage/progress";
import { RootStackParamList } from "../types/navigation";
import { SessionHistoryEntry } from "../types/progress";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

export const HistoryScreen = (_: Props) => {
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);

  const loadHistory = useCallback(async () => {
    const entries = await getSessionHistory();
    setHistory(entries);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session History</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.meta}>{item.coach}</Text>
            {item.messages.slice(-4).map((message, index) => (
              <Text key={`${item.id}-${index}`} style={styles.message}>
                {message.role === "user" ? "You" : "Coach"}: {message.content}
              </Text>
            ))}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700", color: "#0f172a" },
  list: { gap: 12, paddingTop: 12, paddingBottom: 24 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 8,
  },
  meta: { color: "#64748b", fontWeight: "700", fontSize: 12, letterSpacing: 0.6 },
  message: { color: "#334155", fontSize: 14, lineHeight: 20 },
});
