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
import { COACH_OPENING_MESSAGES } from "../ai/prompts";
import { useMonetization } from "../context/MonetizationContext";
import { ChatMessage } from "../types/chat";
import { RootStackParamList } from "../types/navigation";
import { SessionOutcomeData } from "../types/progress";
import { getUserContext } from "../storage/preferences";
import { saveSessionWithOutcome } from "../storage/progress";
import { consumeDailyFreeMessage, isChatPausedForToday } from "../storage/dailyLimit";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

type MessageContentProps = {
  message: ChatMessage;
};

type SessionPhase = "start" | "clarify" | "close";

const ERROR_MESSAGE = "Something went wrong. Try again.";

const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const deriveDraftOutcome = (
  coach: Props["route"]["params"]["coach"],
  messages: ChatMessage[],
): SessionOutcomeData | null => {
  const conversational = messages.filter((message) => !message.isOpening && !message.isError);
  const userMessages = conversational.filter((message) => message.role === "user");
  const assistantMessages = conversational.filter((message) => message.role === "assistant");

  if (userMessages.length === 0 || assistantMessages.length === 0) {
    return null;
  }

  const assistantLatest = assistantMessages[assistantMessages.length - 1]?.content ?? "";
  const userLatest = userMessages[userMessages.length - 1]?.content ?? "";
  const parts = assistantLatest
    .split(/(?<=[.!?])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (coach === "Focus Coach") {
    return {
      kind: "focus",
      priority: parts[0] ?? userLatest,
      firstStep: parts[1] ?? "Take one concrete step in the next 20 minutes.",
      isCompleted: false,
    };
  }

  if (coach === "Decision Coach") {
    return {
      kind: "decision",
      decision: parts[0] ?? userLatest,
      tradeoffAccepted: parts[1] ?? "Accept one downside that comes with this choice.",
    };
  }

  return {
    kind: "reflection",
    insight: parts[0] ?? userLatest,
    questionToCarry: parts[1] ?? "What wants more attention before your next session?",
  };
};

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
  const { coach, initialPriority } = route.params;
  const { isSubscribed } = useMonetization();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const openingMessage = useMemo(
    () => COACH_OPENING_MESSAGES[coach],
    [coach],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [draftOutcome, setDraftOutcome] = useState<SessionOutcomeData | null>(null);
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("start");
  const [isClosingSession, setIsClosingSession] = useState(false);
  const sessionStartedAtRef = useRef(new Date().toISOString());
  const hasPersistedSessionRef = useRef(false);
  const hasNavigatedAfterCloseRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = [];
    sessionStartedAtRef.current = new Date().toISOString();
    hasPersistedSessionRef.current = false;
    hasNavigatedAfterCloseRef.current = false;
    setSessionPhase("start");
    setDraftOutcome(null);

    const seededMessages: ChatMessage[] = [
      {
        id: createMessageId(),
        role: "assistant",
        content: openingMessage,
        isOpening: true,
      },
    ];

    if (initialPriority?.trim()) {
      seededMessages.push({
        id: createMessageId(),
        role: "user",
        content: initialPriority.trim(),
      });
    }

    setMessages(seededMessages);
  }, [initialPriority, openingMessage]);

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
    messagesRef.current = messages;
    const conversationalCount = messages.filter((m) => !m.isOpening && !m.isError).length;

    if (conversationalCount === 0) {
      setSessionPhase("start");
      return;
    }

    if (draftOutcome) {
      setSessionPhase("close");
      return;
    }

    setSessionPhase("clarify");
  }, [draftOutcome, messages]);

  const persistSession = async (messagesToPersist: ChatMessage[]) => {
    if (hasPersistedSessionRef.current) {
      return;
    }

    hasPersistedSessionRef.current = true;

    const localOutcome = deriveDraftOutcome(coach, messagesToPersist);

    await saveSessionWithOutcome({
      coach,
      startedAt: sessionStartedAtRef.current,
      messages: messagesToPersist,
      outcomeOverride: localOutcome,
      reportOverride: null,
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        void persistSession(messagesRef.current);
      };
    }, [coach]),
  );

  useEffect(() => {
    const autoReplyToSeed = async () => {
      const conversational = messages.filter((m) => !m.isOpening && !m.isError);
      const hasAssistantReply = conversational.some((m) => m.role === "assistant");
      const firstUserMessage = conversational.find((m) => m.role === "user");

      if (!firstUserMessage || hasAssistantReply || isSending) {
        return;
      }

      setIsSending(true);
      try {
        const userContext = await getUserContext();
        const reply = await fetchCoachReply({
          coach,
          messages,
          userContext,
        });

        setMessages((prev) => {
          const assistantMessage: ChatMessage = {
            id: createMessageId(),
            role: "assistant",
            content: reply || ERROR_MESSAGE,
            isError: !reply,
          };
          const next = [...prev, assistantMessage];
          setDraftOutcome(deriveDraftOutcome(coach, next));
          return next;
        });
      } finally {
        setIsSending(false);
      }
    };

    void autoReplyToSeed();
  }, [coach, isSending, messages]);

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
    setDraftOutcome(null);

    if (!isSubscribed) {
      const usage = await consumeDailyFreeMessage();

      if (!usage.isWithinLimit) {
        navigation.navigate("Paywall", { coach, source: "chat" });
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
      });

      const assistantContent = reply || ERROR_MESSAGE;

      setMessages((prev) => {
        const assistantMessage: ChatMessage = {
          id: createMessageId(),
          role: "assistant",
          content: assistantContent,
          isError: !reply,
        };
        const next = [...prev, assistantMessage];
        setDraftOutcome(deriveDraftOutcome(coach, next));
        return next;
      });
    } catch {
      setMessages((prev) => {
        const assistantMessage: ChatMessage = {
          id: createMessageId(),
          role: "assistant",
          content: ERROR_MESSAGE,
          isError: true,
        };
        const next = [...prev, assistantMessage];
        setDraftOutcome(deriveDraftOutcome(coach, next));
        return next;
      });
    } finally {
      setIsSending(false);
    }
  };

  const closeSessionIfReady = async () => {
    const conversationalMessages = messagesRef.current.filter((m) => !m.isOpening && !m.isError);

    if (conversationalMessages.length < 2 || !draftOutcome) {
      return;
    }

    setIsClosingSession(true);
    await persistSession(messagesRef.current);
    setIsClosingSession(false);

    if (!hasNavigatedAfterCloseRef.current) {
      hasNavigatedAfterCloseRef.current = true;
      navigation.navigate("Progress");
    }
  };

  useEffect(() => {
    if (!draftOutcome || isSending || isClosingSession) {
      return;
    }

    const timeout = setTimeout(() => {
      void closeSessionIfReady();
    }, 1100);

    return () => clearTimeout(timeout);
  }, [draftOutcome, isClosingSession, isSending]);

  const isSendDisabled = isSending || isPaused || input.trim().length === 0;

  const helperText = isPaused
    ? "Free plan limit reached for today. Upgrade to Plus for unlimited sessions."
    : sessionPhase === "start"
      ? "Step 1: name one priority in plain language."
      : sessionPhase === "clarify"
        ? "Step 2–3: stay with facts and tradeoffs until the choice is clear."
        : "Step 4: outcome captured. Closing session.";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CLARITY SESSION</Text>
          <Text style={styles.headerText}>One priority, one outcome</Text>
        </View>
      </View>

      <View style={styles.phaseRow}>
        <Text style={[styles.phasePill, sessionPhase === "start" && styles.phasePillActive]}>1. Priority</Text>
        <Text style={[styles.phasePill, sessionPhase === "clarify" && styles.phasePillActive]}>2. Reality</Text>
        <Text style={[styles.phasePill, sessionPhase === "clarify" && styles.phasePillActive]}>3. Decision</Text>
        <Text style={[styles.phasePill, sessionPhase === "close" && styles.phasePillActive]}>4. Capture</Text>
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

      {draftOutcome ? (
        <View style={styles.outcomeCard}>
          <Text style={styles.outcomeTitle}>Session outcome</Text>
          {draftOutcome.kind === "focus" ? (
            <>
              <Text style={styles.outcomeLine}>Priority: {draftOutcome.priority}</Text>
              <Text style={styles.outcomeLine}>First step: {draftOutcome.firstStep}</Text>
            </>
          ) : null}
          {draftOutcome.kind === "decision" ? (
            <>
              <Text style={styles.outcomeLine}>Decision: {draftOutcome.decision}</Text>
              <Text style={styles.outcomeLine}>Tradeoff: {draftOutcome.tradeoffAccepted}</Text>
            </>
          ) : null}
          {draftOutcome.kind === "reflection" ? (
            <>
              <Text style={styles.outcomeLine}>Insight: {draftOutcome.insight}</Text>
              <Text style={styles.outcomeLine}>Carry: {draftOutcome.questionToCarry}</Text>
            </>
          ) : null}
          <Text style={styles.autoCloseText}>
            {isClosingSession ? "Closing…" : "Closing automatically."}
          </Text>
        </View>
      ) : null}

      <Text style={styles.helperText}>{helperText}</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Continue"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={input}
          onChangeText={setInput}
          editable={!isSending && !isPaused}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingVertical: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#64748b",
  },
  headerText: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.4,
  },
  phaseRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  phasePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },
  phasePillActive: {
    backgroundColor: "#dbeafe",
    color: "#1e3a8a",
  },
  messages: {
    flex: 1,
  },
  messageContent: {
    gap: 14,
    paddingTop: 8,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: "84%",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#dbeafe",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  messageText: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: {
    color: "#0f172a",
    fontSize: 16,
    lineHeight: 24,
  },
  outcomeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 6,
  },
  outcomeTitle: {
    color: "#334155",
    fontSize: 12,
    letterSpacing: 0.6,
    fontWeight: "700",
  },
  outcomeLine: {
    color: "#0f172a",
    fontSize: 14,
    lineHeight: 20,
  },
  autoCloseText: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748b",
    marginBottom: 8,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  sendButton: {
    minWidth: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#0f172a",
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
