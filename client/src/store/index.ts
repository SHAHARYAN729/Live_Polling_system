import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';
import pollReducer from './slices/pollSlice';
import chatReducer from './slices/chatSlice';
import { socketMiddleware } from './socketMiddleware';

const rootReducer = {
  session: sessionReducer,
  poll: pollReducer,
  chat: chatReducer,
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(socketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
