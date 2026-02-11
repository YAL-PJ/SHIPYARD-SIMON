import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";
import { getInstructionPacks, toggleInstructionPack } from "../storage/instructionPacks";
import { ConnectorConfig, getConnectors, setConnectorConnected, setConnectorContextHint } from "../storage/connectors";

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advanced Portal</Text>
      <Text style={styles.subtitle}>
        Enable instruction packs to shape deeper, premium coaching behavior over time.
      </Text>


      <View style={styles.connectorSection}>
        <Text style={styles.connectorTitle}>Advanced context connectors</Text>
        <Text style={styles.connectorSubtitle}>
          Connect one source to supply explicit constraints the coaches should respect.
        </Text>
        {connectors.map((connector) => (
          <View key={connector.id} style={styles.connectorCard}>
            <View style={styles.row}>
              <View style={styles.textWrap}>
                <Text style={styles.name}>{connector.name}</Text>
                <Text style={styles.description}>{connector.description}</Text>
              </View>
              <Switch
                value={connector.connected}
                onValueChange={(value) => void setConnectorConnected(connector.id, value).then(load)}
              />
            </View>
            <TextInput
              style={styles.connectorInput}
              value={connector.contextHint}
              placeholder="Example: Tue/Thu are meeting-heavy, protect deep work mornings."
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
          </View>
        ))}
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
    minHeight: 50,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    fontSize: 13,
  },

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
