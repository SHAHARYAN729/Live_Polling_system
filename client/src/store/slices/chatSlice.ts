import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage, Participant } from '../../types';

interface ChatState {
  participants: Participant[];
  chatMessages: ChatMessage[];
}

const initialState: ChatState = {
  participants: [],
  chatMessages: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setParticipants(state, action: PayloadAction<Participant[]>) {
      state.participants = action.payload;
    },
    addChatMessage(state, action: PayloadAction<ChatMessage>) {
      state.chatMessages.push(action.payload);
    },
    setChatMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.chatMessages = action.payload;
    },
    resetChat(state) {
      state.participants = [];
      state.chatMessages = [];
    },
  },
});

export const { setParticipants, addChatMessage, setChatMessages, resetChat } =
  chatSlice.actions;

export default chatSlice.reducer;
