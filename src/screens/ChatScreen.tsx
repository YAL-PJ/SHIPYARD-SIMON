import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { fetchCoachReply } from "../ai/openai";
import { useMonetization } from "../context/MonetizationContext";
import { COACH_OPENING_MESSAGES } from "../ai/prompts";
import { ChatMessage } from "../types/chat";
import { RootStackParamList } from "../types/navigation";
import { CoachEditConfig } from "../types/editCoach";
import { getUserContext } from "../storage/preferences";
import { getCoachEditConfig } from "../storage/editedCoach";
import {
  consumeDailyFreeMessage,
  isChatPausedForToday,
} from "../storage/dailyLimit";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

type MessageContentProps = {
  message: ChatMessage;
};

const ERROR_MESSAGE = "Something went wrong. Try again.";

const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const MessageContent = ({ message }: MessageContentProps) => {
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text style={isUser ? styles.userMessageText : styles.messageText}>
        {message.content}
      </Text>
    </View>
  );
};

export const ChatScreen = ({ navigation, route }: Props) => {
  const { coach } = route.params;
  const { isSubscribed } = useMonetization();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const openingMessage = useMemo(
    () => COACH_OPENING_MESSAGES[coach],
    [coach],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasPendingReply, setHasPendingReply] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [editedCoach, setEditedCoach] = useState<CoachEditConfig | null>(null);

  useEffect(() => {
    setMessages([
      {
        id: createMessageId(),
        role: "assistant",
        content: openingMessage,
        isOpening: true,
      },
    ]);
  }, [openingMessage]);

  useFocusEffect(
    React.useCallback(() => {
      const loadEditedCoach = async () => {
        if (!isSubscribed) {
          setEditedCoach(null);
          return;
        }

        const config = await getCoachEditConfig(coach);
        setEditedCoach(config);
      };

      void loadEditedCoach();
    }, [coach, isSubscribed]),
  );

  useFocusEffect(
    React.useCallback(() => {
      const syncPause = async () => {
        if (isSubscribed) {
          setIsPaused(false);
          return;
        }

        const paused = await isChatPausedForToday();
        setIsPaused(paused);
      };

      void syncPause();
    }, [isSubscribed]),
  );

  useEffect(() => {
    if (!hasPendingReply || !isSubscribed || isSending) {
      return;
    }

    const completePendingReply = async () => {
      const latestMessages = messages;

      if (latestMessages.length === 0) {
        return;
      }

      setIsSending(true);

      try {
        const userContext = await getUserContext();
        const reply = await fetchCoachReply({
          coach,
          messages: latestMessages,
          userContext,
          editedCoach,
        });

        const assistantContent = reply || ERROR_MESSAGE;

        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "assistant",
            content: assistantContent,
            isError: !reply,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "assistant",
            content: ERROR_MESSAGE,
            isError: true,
          },
        ]);
      } finally {
        setHasPendingReply(false);
        setIsSending(false);
      }
    };

    void completePendingReply();
  }, [coach, editedCoach, hasPendingReply, isSending, isSubscribed, messages]);

  const handleSend = async () => {
    const trimmed = input.trim();

    if (!trimmed || isSending || isPaused) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];

    setInput("");
    setMessages(nextMessages);

    if (!isSubscribed) {
      const usage = await consumeDailyFreeMessage();

      if (!usage.isWithinLimit) {
        setHasPendingReply(true);
        navigation.navigate("Paywall", { coach });
        return;
      }
    }

    setIsSending(true);

    try {
      const userContext = await getUserContext();
      const reply = await fetchCoachReply({
        coach,
        messages: nextMessages,
        userContext,
        editedCoach,
      });

      const assistantContent = reply || ERROR_MESSAGE;

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          content: assistantContent,
          isError: !reply,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          content: ERROR_MESSAGE,
          isError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const isSendDisabled =
    isSending || isPaused || input.trim().length === 0 || hasPendingReply;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {editedCoach ? `${coach} (Edited)` : coach}
        </Text>
      </View>
      <FlatList
        ref={listRef}
        style={styles.messages}
        data={messages}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => <MessageContent message={item} />}
        contentContainerStyle={styles.messageContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({
            animated: true,
          })
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Type a message"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          value={input}
          onChangeText={setInput}
          editable={!isSending && !isPaused && !hasPendingReply}
        />
        <TouchableOpacity
          accessibilityRole="button"
          style={[
            styles.sendButton,
            isSendDisabled && styles.sendButtonDisabled,
          ]}
          disabled={isSendDisabled}
          onPress={handleSend}
        >
          <Text style={styles.sendText}>{isSending ? "..." : "Send"}</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 10,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "500",
    color: "#111827",
  },
  messages: {
    flex: 1,
  },
  messageContent: {
    gap: 14,
    paddingTop: 6,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f5f6f8",
    borderWidth: 1,
    borderColor: "#eceff3",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#eaf3ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  messageText: {
    color: "#374151",
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: {
    color: "#0f172a",
    fontSize: 16,
    lineHeight: 24,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 14,
    paddingBottom: 2,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
    color: "#111827",
    backgroundColor: "#fff",
  },
  sendButton: {
    minWidth: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
