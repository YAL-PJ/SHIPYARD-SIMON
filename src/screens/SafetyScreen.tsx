import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Safety">;

const CRISIS_URL = "https://988lifeline.org/";

export const SafetyScreen = (_: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coaching boundaries</Text>
      <Text style={styles.body}>
        Kavanah is a coaching companion for clarity, decisions, and reflection. It is not therapy,
        emergency support, or medical/legal/financial advice.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>If you are in immediate danger</Text>
        <Text style={styles.cardText}>Call local emergency services now.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>If you need mental health crisis support</Text>
        <Text style={styles.cardText}>In the U.S. and Canada, call or text 988 for immediate help.</Text>
        <TouchableOpacity style={styles.linkButton} onPress={() => void Linking.openURL(CRISIS_URL)}>
          <Text style={styles.linkText}>Open 988 resource</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        You can continue coaching when you want structured thinking support.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20, gap: 12 },
  title: { fontSize: 30, fontWeight: "700", color: "#0f172a" },
  body: { color: "#334155", lineHeight: 22 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 12,
    gap: 6,
  },
  cardTitle: { color: "#0f172a", fontWeight: "700" },
  cardText: { color: "#475569", lineHeight: 20 },
  linkButton: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  linkText: { color: "#fff", fontWeight: "600" },
  footer: { marginTop: "auto", color: "#64748b" },
});
