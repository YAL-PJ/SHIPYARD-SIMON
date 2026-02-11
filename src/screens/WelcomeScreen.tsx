import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { RootStackParamList } from "../types/navigation";
import { setHasSeenWelcome, setUserContext } from "../storage/preferences";
import { setMemoryEnabled } from "../storage/memory";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export const WelcomeScreen = ({ navigation }: Props) => {
  const [contextInput, setContextInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [memoryEnabled, setMemoryEnabledChoice] = useState(true);

  const trimmedContext = contextInput.trim();

  const handleContinue = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await Promise.all([
        setUserContext(trimmedContext),
        setHasSeenWelcome(true),
        setMemoryEnabled(memoryEnabled),
      ]);
    } catch {
      // Persisted preferences are best-effort; onboarding should still continue.
    } finally {
      setIsSaving(false);
      navigation.replace("Home");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>KAVANAH • COACHING APP</Text>
          </View>
          <Text style={styles.title}>Find your next clear move.</Text>
          <Text style={styles.subtitle}>
            When you feel overwhelmed, Kavanah helps you slow down, sort priorities,
            and choose one action that matters.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>What are you navigating right now?</Text>
          <TextInput
            placeholder="Example: juggling deadlines and feeling scattered"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={contextInput}
            onChangeText={setContextInput}
            editable={!isSaving}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={220}
          />
          <View style={styles.hintRow}>
            <Text style={styles.hint}>Optional, but it helps personalize your first check-in.</Text>
            <Text style={styles.counter}>{contextInput.length}/220</Text>
          </View>

          <View style={styles.memoryCard}>
            <Text style={styles.memoryTitle}>Memory setting</Text>
            <Text style={styles.memoryText}>
              To help you think better over time, Kavanah remembers patterns from your sessions.
              You can review or turn this off anytime.
            </Text>
            <View style={styles.memoryActions}>
              <TouchableOpacity
                style={[styles.memoryButton, memoryEnabled && styles.memoryButtonActive]}
                onPress={() => setMemoryEnabledChoice(true)}
              >
                <Text style={[styles.memoryButtonText, memoryEnabled && styles.memoryButtonTextActive]}>
                  Continue with memory
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.memoryButton, !memoryEnabled && styles.memoryButtonActive]}
                onPress={() => setMemoryEnabledChoice(false)}
              >
                <Text style={[styles.memoryButtonText, !memoryEnabled && styles.memoryButtonTextActive]}>
                  Turn off memory
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Start coaching"
            onPress={handleContinue}
            disabled={isSaving}
            style={[styles.primaryButton, isSaving ? styles.primaryButtonDisabled : null]}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Start coaching</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  heroSection: {
    paddingTop: 20,
    gap: 12,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  badgeText: {
    color: "#334155",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.7,
    fontWeight: "600",
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 350,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 18,
    gap: 12,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#0f172a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
    backgroundColor: "#fff",
    minHeight: 78,
  },
  hintRow: { flexDirection: "row", justifyContent: "space-between" },
  hint: { color: "#64748b", fontSize: 12, flex: 1, marginRight: 8 },
  counter: { color: "#94a3b8", fontSize: 12 },
  memoryCard: {
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 14,
    padding: 10,
    gap: 8,
    backgroundColor: "#f8fafc",
  },
  memoryTitle: { color: "#0f172a", fontWeight: "700", fontSize: 13 },
  memoryText: { color: "#475569", fontSize: 13, lineHeight: 18 },
  memoryActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  memoryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  memoryButtonActive: { borderColor: "#1e40af", backgroundColor: "#dbeafe" },
  memoryButtonText: { color: "#334155", fontSize: 12, fontWeight: "600" },
  memoryButtonTextActive: { color: "#1e3a8a" },
  primaryButton: {
    marginTop: 4,
    backgroundColor: "#0f172a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
