import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Switch, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";
import { getInstructionPacks, toggleInstructionPack } from "../storage/instructionPacks";

type Props = NativeStackScreenProps<RootStackParamList, "Portal">;

type PackRow = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export const PortalScreen = (_: Props) => {
  const [packs, setPacks] = useState<PackRow[]>([]);

  const load = useCallback(async () => {
    const next = await getInstructionPacks();
    setPacks(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advanced Portal</Text>
      <Text style={styles.subtitle}>
        Enable instruction packs to shape deeper, premium coaching behavior over time.
      </Text>

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
