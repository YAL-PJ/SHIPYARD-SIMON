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
    gap: 26,
    paddingTop: 44,
  },
  title: {
    fontSize: 30,
    lineHeight: 40,
    fontWeight: "500",
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    lineHeight: 22,
    color: "#111827",
    backgroundColor: "#fff",
  },
  skipText: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 22,
    fontWeight: "400",
  },
});
