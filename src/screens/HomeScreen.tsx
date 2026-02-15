import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";
import { useMonetization } from "../context/MonetizationContext";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export const HomeScreen = ({ navigation }: Props) => {
  const { isSubscribed } = useMonetization();
  const [priorityInput, setPriorityInput] = useState("");
  const trimmedPriority = priorityInput.trim();

  const isStartDisabled = useMemo(
    () => trimmedPriority.length < 6,
    [trimmedPriority.length],
  );

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.eyebrow}>KAVANAH</Text>
        <Text style={styles.title}>Kaboooommm123XX
Think one priority through.</Text>
        <Text style={styles.subtitle}>
          A calm thinking companion for decision clarity and private reflection.
        </Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.label}>What is the one priority for this session?</Text>
        <TextInput
          value={priorityInput}
          onChangeText={setPriorityInput}
          style={styles.input}
          placeholder="Example: Decide whether to accept the new role"
          placeholderTextColor="#94a3b8"
          multiline
          maxLength={180}
          textAlignVertical="top"
        />
        <Text style={styles.helperText}>Keep it specific. One situation only.</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryCta, isStartDisabled && styles.primaryCtaDisabled]}
        disabled={isStartDisabled}
        onPress={() =>
          navigation.navigate("Chat", {
            coach: "Focus Coach",
            initialPriority: trimmedPriority,
          })
        }
      >
        <Text style={styles.primaryCtaTitle}>Start clarity session</Text>
        <Text style={styles.primaryCtaSub}>Structured sequence → clear outcome</Text>
      </TouchableOpacity>


      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          navigation.navigate("Paywall", {
            coach: "Focus Coach",
            source: "home",
          })
        }
      >
        <Text style={styles.secondaryButtonText}>{isSubscribed ? "Manage Plus" : "View Plus plan"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("Progress")}
      >
        <Text style={styles.secondaryButtonText}>Open reflection timeline</Text>
      </TouchableOpacity>

      <Text style={styles.boundaryText}>
        Coaching support only. Not medical, legal, financial, or crisis care.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: "#f8fafc",
    gap: 14,
  },
  topSection: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#64748b",
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
  },
  inputCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 8,
  },
  label: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
    backgroundColor: "#fff",
    fontSize: 15,
    lineHeight: 21,
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
  },
  primaryCta: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#0f172a",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  primaryCtaDisabled: {
    opacity: 0.45,
  },
  primaryCtaTitle: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  primaryCtaSub: { color: "#cbd5e1", fontSize: 12 },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  boundaryText: {
    marginTop: "auto",
    fontSize: 12,
    lineHeight: 17,
    color: "#64748b",
  },
});
