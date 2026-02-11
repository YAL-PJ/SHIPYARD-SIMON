import React, { useEffect, useMemo, useState } from "react";
import {
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
      <Text style={styles.title}>Edit {coach}</Text>
      <Text style={styles.label}>Goal emphasis</Text>
      <TextInput
        style={styles.input}
        value={draft.goalEmphasis}
        placeholder="What should this coach prioritize more?"
        placeholderTextColor="#9ca3af"
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
        placeholderTextColor="#9ca3af"
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

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveText}>{isSaving ? "..." : "Save"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#111827",
    marginBottom: 16,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  toneRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  toneOption: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  toneOptionActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  toneTextDefault: {
    color: "#111827",
    fontWeight: "500",
  },
  toneTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  errorText: {
    color: "#b91c1c",
    marginBottom: 12,
  },
  saveButton: {
    marginTop: "auto",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#111827",
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
