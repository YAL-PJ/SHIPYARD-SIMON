import AsyncStorage from "@react-native-async-storage/async-storage";

const DAILY_LIMIT_KEY = "daily_limit_state";
const DAILY_MESSAGE_CAP = 10;

type DailyLimitState = {
  dayKey: string;
  messagesSentToday: number;
  pausedDayKey: string | null;
};

const getDayKey = (date = new Date()) => date.toISOString().slice(0, 10);

const createInitialState = (dayKey: string): DailyLimitState => ({
  dayKey,
  messagesSentToday: 0,
  pausedDayKey: null,
});

const normalizeStateForToday = (
  state: DailyLimitState,
  todayKey: string,
): DailyLimitState => {
  if (state.dayKey === todayKey) {
    return state;
  }

  return createInitialState(todayKey);
};

const readState = async (): Promise<DailyLimitState> => {
  const todayKey = getDayKey();
  const raw = await AsyncStorage.getItem(DAILY_LIMIT_KEY);

  if (!raw) {
    return createInitialState(todayKey);
  }

  try {
    const parsed = JSON.parse(raw) as DailyLimitState;

    if (
      typeof parsed.dayKey !== "string" ||
      typeof parsed.messagesSentToday !== "number"
    ) {
      return createInitialState(todayKey);
    }

    return normalizeStateForToday(
      {
        dayKey: parsed.dayKey,
        messagesSentToday: parsed.messagesSentToday,
        pausedDayKey:
          typeof parsed.pausedDayKey === "string" ? parsed.pausedDayKey : null,
      },
      todayKey,
    );
  } catch {
    return createInitialState(todayKey);
  }
};

const writeState = async (state: DailyLimitState) => {
  await AsyncStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(state));
};

export const consumeDailyFreeMessage = async () => {
  const state = await readState();
  const nextState: DailyLimitState = {
    ...state,
    messagesSentToday: state.messagesSentToday + 1,
  };

  await writeState(nextState);

  return {
    isWithinLimit: nextState.messagesSentToday <= DAILY_MESSAGE_CAP,
  };
};

export const pauseChatForToday = async () => {
  const state = await readState();
  const nextState: DailyLimitState = {
    ...state,
    pausedDayKey: state.dayKey,
  };

  await writeState(nextState);
};

export const isChatPausedForToday = async () => {
  const state = await readState();
  return state.pausedDayKey === state.dayKey;
};

export const DAILY_LIMIT = DAILY_MESSAGE_CAP;
