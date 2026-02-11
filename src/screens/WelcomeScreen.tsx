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

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export const WelcomeScreen = ({ navigation }: Props) => {
  const [contextInput, setContextInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const trimmedContext = contextInput.trim();

  const handleContinue = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await setUserContext(trimmedContext);
      await setHasSeenWelcome(true);
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
            <Text style={styles.badgeText}>SHIPYARD • PERSONAL COACH</Text>
          </View>
          <Text style={styles.title}>Find your next clear move.</Text>
          <Text style={styles.subtitle}>
            When you feel overwhelmed, Simon helps you slow down, sort priorities,
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

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Skip context and continue"
            onPress={handleContinue}
            disabled={isSaving}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
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
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  badgeText: {
    color: "#cbd5e1",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.7,
    fontWeight: "600",
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 350,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    gap: 12,
    shadowColor: "#020617",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#0f172a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 92,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  hintRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  hint: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748b",
  },
  counter: {
    fontSize: 12,
    lineHeight: 16,
    color: "#94a3b8",
    fontVariant: ["tabular-nums"],
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    minHeight: 52,
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
    fontWeight: "500",
  },
});
