import type { Middleware } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import type { SocketOption } from '../types';
import sessionReducer from './slices/sessionSlice';
import pollReducer from './slices/pollSlice';
import chatReducer from './slices/chatSlice';

// Derive state shape from reducers to avoid circular import with store/index
type MiddlewareRootState = {
  session: ReturnType<typeof sessionReducer>;
  poll: ReturnType<typeof pollReducer>;
  chat: ReturnType<typeof chatReducer>;
};
import {
  setConnected,
  setPhase,
  setRole,
  setStudentName,
  setTeacherOnline,
  setSocketId,
  resetSession,
} from './slices/sessionSlice';
import {
  questionStarted,
  voteUpdated,
  questionEnded,
  setLastAnsweredIndex,
  resetPoll,
  setActiveQuestion,
  setVotes,
  setTotalVotes,
  setPercentages,
} from './slices/pollSlice';
import {
  setParticipants,
  addChatMessage,
  setChatMessages,
  resetChat,
} from './slices/chatSlice';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

/* ── Socket action types (dispatched by components) ── */
export const SOCKET_CONNECT_AS_TEACHER = 'socket/connectAsTeacher';
export const SOCKET_CONNECT_AS_STUDENT = 'socket/connectAsStudent';
export const SOCKET_ASK_QUESTION = 'socket/askQuestion';
export const SOCKET_SUBMIT_ANSWER = 'socket/submitAnswer';
export const SOCKET_KICK_STUDENT = 'socket/kickStudent';
export const SOCKET_END_QUESTION = 'socket/endQuestion';
export const SOCKET_SEND_CHAT = 'socket/sendChat';
export const SOCKET_DISCONNECT = 'socket/disconnect';

/* ── action creators ── */
export const connectAsTeacher = () => ({ type: SOCKET_CONNECT_AS_TEACHER });
export const connectAsStudent = (name: string) => ({
  type: SOCKET_CONNECT_AS_STUDENT,
  payload: { name },
});
export const askQuestion = (data: { text: string; options: SocketOption[]; timer: number }) => ({
  type: SOCKET_ASK_QUESTION,
  payload: data,
});
export const submitAnswer = (optionIndex: number) => ({
  type: SOCKET_SUBMIT_ANSWER,
  payload: { optionIndex },
});
export const kickStudent = (studentId: string) => ({
  type: SOCKET_KICK_STUDENT,
  payload: { studentId },
});
export const endQuestion = () => ({ type: SOCKET_END_QUESTION });
export const sendChat = (message: string) => ({
  type: SOCKET_SEND_CHAT,
  payload: { message },
});
export const socketDisconnect = () => ({ type: SOCKET_DISCONNECT });

/* ── Singleton socket ref ── */
let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

/* ── Middleware ── */
export const socketMiddleware: Middleware<object, MiddlewareRootState> = (store) => {
  let listenersBound = false;
  let autoReconnectAttempted = false;

  function ensureSocket() {
    if (socket) return socket;

    socket = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    // --- core connection events ---
    socket.on('connect', () => {
      store.dispatch(setConnected(true));
      store.dispatch(setSocketId(socket!.id ?? null));
    });

    socket.on('disconnect', () => {
      store.dispatch(setConnected(false));
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Cannot connect to server. Make sure the server is running.');
    });

    socket.on('error', ({ message }: { message: string }) => {
      toast.error(message);
    });

    return socket;
  }

  function bindListeners(s: Socket) {
    if (listenersBound) return;
    listenersBound = true;

    s.on('question-started', ({ question }) => {
      store.dispatch(questionStarted(question));
      const state = store.getState();
      if (
        state.session.phase === 'teacher-create' ||
        state.session.phase === 'teacher-active'
      ) {
        store.dispatch(setPhase('teacher-active'));
      } else {
        store.dispatch(setPhase('student-question'));
      }
    });

    s.on('vote-update', ({ votes, total, percentages }) => {
      store.dispatch(voteUpdated({ votes, total, percentages }));
    });

    s.on('question-ended', (data) => {
      const state = store.getState();
      const prevQ = state.poll.activeQuestion;
      const endData = {
        ...data,
        options: prevQ?.options,
        questionText: prevQ?.text,
        questionNumber: prevQ?.questionNumber,
      };
      store.dispatch(questionEnded(endData));

      // Use role (not phase) to determine transition — teacher may be on poll-history
      if (state.session.role === 'teacher') {
        store.dispatch(setPhase('teacher-results'));
      } else {
        store.dispatch(setPhase('student-answered'));
      }
    });

    s.on('answer-accepted', ({ optionIndex }) => {
      // Optimistic update already applied in SOCKET_SUBMIT_ANSWER —
      // only set if not already matching (e.g. late server confirmation).
      const state = store.getState();
      if (state.poll.lastAnsweredIndex !== optionIndex) {
        store.dispatch(setLastAnsweredIndex(optionIndex));
        store.dispatch(setPhase('student-answered'));
      }
      toast.success('Answer submitted!');
    });

    s.on('you-are-kicked', () => {
      store.dispatch(setPhase('student-kicked'));
      toast.error("You've been removed from the session.");
    });

    s.on('participants-update', ({ participants }) => {
      store.dispatch(setParticipants(participants));
    });

    s.on('chat-message', (msg) => {
      store.dispatch(addChatMessage(msg));
    });

    s.on('teacher-connected', () => {
      store.dispatch(setTeacherOnline(true));
    });

    s.on('teacher-disconnected', () => {
      store.dispatch(setTeacherOnline(false));
      toast.warning('Teacher has disconnected. Waiting for reconnection...');
      // Don't change phase or clear poll — teacher may just be refreshing.
      // If the teacher truly leaves, the poll timer will still auto-end on the server.
    });

    s.on(
      'session-state',
      (data: {
        activeQuestion: import('../types').ActiveQuestion | null;
        votes: import('../types').VoteState;
        total: number;
        percentages: { [key: number]: number };
        chatMessages: import('../types').ChatMessage[];
        participants: Array<{ id: string; name: string }>;
        hasAnswered?: boolean;
        answeredOptionIndex?: number;
      }) => {
        const state = store.getState();

        // Restore poll state
        if (data.activeQuestion) {
          store.dispatch(setActiveQuestion(data.activeQuestion));
        }
        store.dispatch(setVotes(data.votes));
        store.dispatch(setTotalVotes(data.total));
        store.dispatch(setPercentages(data.percentages));
        store.dispatch(setChatMessages(data.chatMessages));
        store.dispatch(setParticipants(data.participants));
        store.dispatch(setTeacherOnline(true));

        // Determine correct phase
        if (state.session.role === 'teacher') {
          if (data.activeQuestion) {
            store.dispatch(setPhase('teacher-active'));
          } else {
            store.dispatch(setPhase('teacher-create'));
          }
        } else if (state.session.role === 'student') {
          if (data.hasAnswered && data.answeredOptionIndex !== undefined) {
            store.dispatch(setLastAnsweredIndex(data.answeredOptionIndex));
            store.dispatch(setPhase('student-answered'));
          } else if (data.activeQuestion) {
            store.dispatch(setPhase('student-question'));
          } else {
            store.dispatch(setPhase('student-waiting'));
          }
        }
      }
    );
  }

  // ── Auto-reconnect on page load (browser refresh recovery) ──
  function tryAutoReconnect() {
    if (autoReconnectAttempted) return;
    autoReconnectAttempted = true;

    const savedRole = sessionStorage.getItem('poll_role');
    const savedPhase = sessionStorage.getItem('poll_phase');

    // Only reconnect if we were in an active session (not role-select or kicked)
    if (!savedRole || !savedPhase || savedPhase === 'role-select' || savedPhase === 'student-kicked') {
      return;
    }

    const s = ensureSocket();
    bindListeners(s);

    if (savedRole === 'teacher') {
      s.connect();
      s.once('connect', () => {
        s.emit('join-as-teacher');
      });
    } else if (savedRole === 'student') {
      const savedName = sessionStorage.getItem('poll_student_name');
      if (savedName) {
        s.connect();
        s.once('connect', () => {
          s.emit('rejoin-as-student', { name: savedName });
        });
      }
    }
  }

  // Kick off auto-reconnect on first middleware tick (after store is ready)
  setTimeout(() => tryAutoReconnect(), 0);

  return (next) => (action) => {
    const result = next(action);

    switch ((action as { type: string }).type) {
      case SOCKET_CONNECT_AS_TEACHER: {
        const s = ensureSocket();
        bindListeners(s);
        if (!s.connected) {
          s.connect();
          s.once('connect', () => {
            s.emit('join-as-teacher');
          });
        } else {
          s.emit('join-as-teacher');
        }
        store.dispatch(setRole('teacher'));
        store.dispatch(setTeacherOnline(true));
        store.dispatch(setPhase('teacher-create'));
        break;
      }

      case SOCKET_CONNECT_AS_STUDENT: {
        const { name } = (action as { type: string; payload: { name: string } }).payload;
        const s = ensureSocket();
        bindListeners(s);
        store.dispatch(setStudentName(name));
        store.dispatch(setPhase('student-connecting'));

        if (!s.connected) {
          s.connect();
          s.once('connect', () => {
            s.emit('join-as-student', { name });
            store.dispatch(setPhase('student-waiting'));
          });
          s.once('connect_error', () => {
            store.dispatch(setPhase('student-name'));
          });
        } else {
          s.emit('join-as-student', { name });
          store.dispatch(setPhase('student-waiting'));
        }
        break;
      }

      case SOCKET_ASK_QUESTION: {
        const data = (action as { type: string; payload: { text: string; options: SocketOption[]; timer: number } }).payload;
        socket?.emit('ask-question', data);
        break;
      }

      case SOCKET_SUBMIT_ANSWER: {
        const { optionIndex } = (action as { type: string; payload: { optionIndex: number } }).payload;

        // ── Optimistic update: show answer immediately ──
        store.dispatch(setLastAnsweredIndex(optionIndex));
        store.dispatch(setPhase('student-answered'));

        socket?.emit('submit-answer', { optionIndex });

        // Revert on error (server-side rejection)
        const revertHandler = () => {
          store.dispatch(setLastAnsweredIndex(null));
          store.dispatch(setPhase('student-question'));
        };
        socket?.once('error', revertHandler);

        // If answer is accepted, remove the revert handler
        socket?.once('answer-accepted', () => {
          socket?.off('error', revertHandler);
        });
        break;
      }

      case SOCKET_KICK_STUDENT: {
        const { studentId } = (action as { type: string; payload: { studentId: string } }).payload;
        socket?.emit('kick-student', { studentId });
        toast.success('Student removed from session.');
        break;
      }

      case SOCKET_END_QUESTION: {
        socket?.emit('end-question');
        break;
      }

      case SOCKET_SEND_CHAT: {
        const { message } = (action as { type: string; payload: { message: string } }).payload;
        socket?.emit('send-chat', { message });
        break;
      }

      case SOCKET_DISCONNECT: {
        socket?.disconnect();
        socket = null;
        listenersBound = false;
        store.dispatch(resetSession());
        store.dispatch(resetPoll());
        store.dispatch(resetChat());
        break;
      }
    }

    return result;
  };
};
