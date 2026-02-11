import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";
import {
  MemoryItem,
  deleteMemoryItem,
  getMemoryItems,
  isMemoryEnabled,
  saveManualMemoryItem,
  setMemoryEnabled,
  updateMemoryItem,
} from "../storage/memory";

type Props = NativeStackScreenProps<RootStackParamList, "Memory">;

export const MemoryScreen = (_: Props) => {
  const [enabled, setEnabled] = useState(true);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [newItem, setNewItem] = useState("");

  const loadState = useCallback(async () => {
    const [nextEnabled, nextItems] = await Promise.all([isMemoryEnabled(), getMemoryItems()]);
    setEnabled(nextEnabled);
    setItems(nextItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadState();
    }, [loadState]),
  );

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    await setMemoryEnabled(value);
  };

  const handleAdd = async () => {
    if (!newItem.trim()) {
      return;
    }

    await saveManualMemoryItem(newItem, "value");
    setNewItem("");
    await loadState();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What I&apos;ve learned about you</Text>
      <Text style={styles.subtitle}>
        Memory helps coaching improve over time. You can edit, delete, or turn it off.
      </Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Memory</Text>
        <Switch value={enabled} onValueChange={handleToggle} />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a value or context detail"
          placeholderTextColor="#94a3b8"
          value={newItem}
          onChangeText={setNewItem}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.meta}>
              {item.type.toUpperCase()} • {item.source === "system" ? "Detected" : "Added by you"}
            </Text>
            <TextInput
              style={styles.itemInput}
              multiline
              value={item.label}
              onChangeText={(value) =>
                void updateMemoryItem(item.id, (current) => ({
                  ...current,
                  label: value,
                  updatedAt: new Date().toISOString(),
                }))
              }
              onBlur={() => void loadState()}
            />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() =>
                Alert.alert("Delete memory?", "This removes it from future coaching context.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => void deleteMemoryItem(item.id).then(loadState),
                  },
                ])
              }
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  title: { fontSize: 28, fontWeight: "700", color: "#0f172a" },
  subtitle: { color: "#475569", lineHeight: 20, marginTop: 8 },
  toggleRow: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleLabel: { fontSize: 15, color: "#0f172a", fontWeight: "600" },
  inputRow: { flexDirection: "row", marginTop: 12, gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: "#0f172a",
  },
  addButton: {
    borderRadius: 12,
    backgroundColor: "#0f172a",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "600" },
  list: { paddingTop: 12, paddingBottom: 24, gap: 10 },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 12,
    gap: 8,
  },
  meta: { color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  itemInput: {
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
    color: "#0f172a",
  },
  deleteButton: {
    alignSelf: "flex-end",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  deleteText: { color: "#b91c1c", fontWeight: "600", fontSize: 12 },
});
