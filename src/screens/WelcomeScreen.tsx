import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";
import { setHasSeenWelcome, setUserContext } from "../storage/preferences";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export const WelcomeScreen = ({ navigation }: Props) => {
  const [contextInput, setContextInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await setUserContext(contextInput);
      await setHasSeenWelcome(true);
    } catch {
      // Persisted preferences are best-effort; onboarding should still continue.
    } finally {
      setIsSaving(false);
      navigation.replace("Home");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Calm, opinionated AI coaching for the moment you feel stuck.
        </Text>
        <TextInput
          placeholder="Context (optional)"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          value={contextInput}
          onChangeText={setContextInput}
          editable={!isSaving}
        />
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={handleContinue}
        disabled={isSaving}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  content: {
    gap: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  skipText: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "500",
  },
});
