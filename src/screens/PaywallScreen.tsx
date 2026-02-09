import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const PaywallScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Unlimited calm, when you need it.</Text>
        <Text style={styles.subtitle}>
          Unlimited access to every coach, whenever you need clarity.
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" style={styles.primaryButton}>
          <Text style={styles.primaryText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button">
          <Text style={styles.restoreText}>Restore purchase</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 32,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  restoreText: {
    color: "#2563eb",
    textAlign: "center",
    fontWeight: "500",
  },
});
