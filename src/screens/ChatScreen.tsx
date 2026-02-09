import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export const ChatScreen = ({ navigation, route }: Props) => {
  const { coach } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{coach}</Text>
      </View>
      <View style={styles.messages}>
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>Messages will appear here.</Text>
        </View>
        <View style={[styles.messageBubble, styles.userBubble]}>
          <Text style={styles.userMessageText}>Your replies will show here.</Text>
        </View>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Type a message"
          placeholderTextColor="#9ca3af"
          style={styles.input}
        />
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.sendButton}
          onPress={() => {}}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.paywallLink}
        onPress={() => navigation.navigate("Paywall")}
      >
        <Text style={styles.paywallText}>Go to Paywall</Text>
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
  header: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  messages: {
    flex: 1,
    gap: 12,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#e0f2fe",
  },
  messageText: {
    color: "#374151",
  },
  userMessageText: {
    color: "#0f172a",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
  paywallLink: {
    marginTop: 16,
    alignItems: "center",
  },
  paywallText: {
    color: "#2563eb",
    fontWeight: "500",
  },
});
