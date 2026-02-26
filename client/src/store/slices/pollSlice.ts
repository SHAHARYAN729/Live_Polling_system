import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ActiveQuestion, QuestionEndData, VoteState } from '../../types';

interface PollState {
  activeQuestion: ActiveQuestion | null;
  votes: VoteState;
  totalVotes: number;
  percentages: { [key: number]: number };
  lastAnsweredIndex: number | null;
  questionEndData: QuestionEndData | null;
}

const initialState: PollState = {
  activeQuestion: null,
  votes: {},
  totalVotes: 0,
  percentages: {},
  lastAnsweredIndex: null,
  questionEndData: null,
};

const pollSlice = createSlice({
  name: 'poll',
  initialState,
  reducers: {
    setActiveQuestion(state, action: PayloadAction<ActiveQuestion | null>) {
      state.activeQuestion = action.payload;
    },
    setVotes(state, action: PayloadAction<VoteState>) {
      state.votes = action.payload;
    },
    setTotalVotes(state, action: PayloadAction<number>) {
      state.totalVotes = action.payload;
    },
    setPercentages(state, action: PayloadAction<{ [key: number]: number }>) {
      state.percentages = action.payload;
    },
    setLastAnsweredIndex(state, action: PayloadAction<number | null>) {
      state.lastAnsweredIndex = action.payload;
    },
    setQuestionEndData(state, action: PayloadAction<QuestionEndData | null>) {
      state.questionEndData = action.payload;
    },
    questionStarted(state, action: PayloadAction<ActiveQuestion>) {
      state.activeQuestion = action.payload;
      state.votes = {};
      state.totalVotes = 0;
      state.percentages = {};
      state.questionEndData = null;
      state.lastAnsweredIndex = null;
    },
    voteUpdated(
      state,
      action: PayloadAction<{ votes: VoteState; total: number; percentages: { [key: number]: number } }>
    ) {
      state.votes = action.payload.votes;
      state.totalVotes = action.payload.total;
      state.percentages = action.payload.percentages;
    },
    questionEnded(
      state,
      action: PayloadAction<{
        votes: VoteState;
        total: number;
        percentages: { [key: number]: number };
        correctAnswerIndex: number;
        options?: { text: string; isCorrect: boolean }[];
        questionText?: string;
        questionNumber?: number;
      }>
    ) {
      state.questionEndData = action.payload;
      state.activeQuestion = null;
      state.votes = action.payload.votes;
      state.totalVotes = action.payload.total;
      state.percentages = action.payload.percentages;
    },
    resetPoll(state) {
      state.activeQuestion = null;
      state.votes = {};
      state.totalVotes = 0;
      state.percentages = {};
      state.lastAnsweredIndex = null;
      state.questionEndData = null;
    },
  },
});

export const {
  setActiveQuestion,
  setVotes,
  setTotalVotes,
  setPercentages,
  setLastAnsweredIndex,
  setQuestionEndData,
  questionStarted,
  voteUpdated,
  questionEnded,
  resetPoll,
} = pollSlice.actions;

export default pollSlice.reducer;
