import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useMonetization } from "../context/MonetizationContext";
import {
  createCoachEditDraft,
  getCoachEditConfig,
  getCoachEditInputLimits,
  saveCoachEditConfig,
} from "../storage/editedCoach";
import { RootStackParamList } from "../types/navigation";
import { CoachEditConfig, EDIT_TONE_OPTIONS } from "../types/editCoach";

type Props = NativeStackScreenProps<RootStackParamList, "EditCoach">;

const SAVE_ERROR_MESSAGE = "We couldn't save right now. Please try again.";

export const EditCoachScreen = ({ navigation, route }: Props) => {
  const { coach } = route.params;
  const { isSubscribed } = useMonetization();
  const { maxGoalEmphasisLength, maxConstraintsLength } = useMemo(
    () => getCoachEditInputLimits(),
    [],
  );

  const [draft, setDraft] = useState<CoachEditConfig>(createCoachEditDraft(coach));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadDraft = async () => {
      const existing = await getCoachEditConfig(coach);
      setDraft(existing ?? createCoachEditDraft(coach));
    };

    void loadDraft();
  }, [coach]);

  useEffect(() => {
    if (!isSubscribed) {
      navigation.replace("Paywall", { coach, source: "edit" });
    }
  }, [coach, isSubscribed, navigation]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await saveCoachEditConfig(draft);
      navigation.navigate("Chat", { coach });
    } catch {
      setErrorMessage(SAVE_ERROR_MESSAGE);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>PRO PERSONALIZATION</Text>
        <Text style={styles.title}>Edit {coach}</Text>
        <Text style={styles.subtitle}>
          Fine-tune how your coach responds so guidance feels precise, calm, and aligned to you.
        </Text>

        <Text style={styles.label}>Goal emphasis</Text>
        <TextInput
          style={styles.input}
          value={draft.goalEmphasis}
          placeholder="What should this coach prioritize more?"
          placeholderTextColor="#94a3b8"
          onChangeText={(value) =>
            setDraft((prev) => ({
              ...prev,
              goalEmphasis: value.slice(0, maxGoalEmphasisLength),
            }))
          }
          maxLength={maxGoalEmphasisLength}
        />

        <Text style={styles.label}>Tone preference</Text>
        <View style={styles.toneRow}>
          {EDIT_TONE_OPTIONS.map((option) => {
            const isSelected = draft.tone === option;

            return (
              <TouchableOpacity
                key={option}
                accessibilityRole="button"
                style={[styles.toneOption, isSelected && styles.toneOptionActive]}
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    tone: option,
                  }))
                }
              >
                <Text
                  style={isSelected ? styles.toneTextActive : styles.toneTextDefault}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Constraint</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={draft.constraints}
          placeholder="Short instruction to keep this coach inside your boundaries."
          placeholderTextColor="#94a3b8"
          onChangeText={(value) =>
            setDraft((prev) => ({
              ...prev,
              constraints: value.slice(0, maxConstraintsLength),
            }))
          }
          maxLength={maxConstraintsLength}
          multiline
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveText}>{isSaving ? "..." : "Save changes"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: "#f8fafc",
  },
  content: {
    paddingBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.9,
    color: "#64748b",
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
    marginTop: 6,
    marginBottom: 20,
    maxWidth: 360,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#0f172a",
    marginBottom: 18,
    backgroundColor: "#ffffff",
  },
  inputMultiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  toneRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  toneOption: {
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  toneOptionActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  toneTextDefault: {
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  toneTextActive: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#0f172a",
    shadowColor: "#020617",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
