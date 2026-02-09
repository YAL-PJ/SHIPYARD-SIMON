import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { fetchCoachReply } from "../ai/openai";
import { COACH_OPENING_MESSAGES } from "../ai/prompts";
import { ChatMessage } from "../types/chat";
import { RootStackParamList } from "../types/navigation";
import { getUserContext } from "../storage/preferences";

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

export const ChatScreen = ({ route }: Props) => {
  const { coach } = route.params;
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const openingMessage = useMemo(
    () => COACH_OPENING_MESSAGES[coach],
    [coach],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

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

  const handleSend = async () => {
    const trimmed = input.trim();

    if (!trimmed || isSending) {
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
    setIsSending(true);

    try {
      const userContext = await getUserContext();
      const reply = await fetchCoachReply({
        coach,
        messages: nextMessages,
        userContext,
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
    } catch (error) {
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

  const isSendDisabled = isSending || input.trim().length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{coach}</Text>
      </View>
      <FlatList
        ref={listRef}
        style={styles.messages}
        data={messages}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => <MessageContent message={item} />}
        contentContainerStyle={styles.messageContent}
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
          editable={!isSending}
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
  },
  messageContent: {
    gap: 12,
    paddingBottom: 12,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 12,
  },
  assistantBubble: {
    alignSelf: "flex-start",
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
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
});
