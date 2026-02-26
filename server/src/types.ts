export interface SocketOption {
  text: string;
  isCorrect: boolean;
}

export interface ActiveQuestion {
  id: string;
  text: string;
  options: SocketOption[];
  timer: number; // seconds
  questionNumber: number;
  startedAt: number; // timestamp
}

export interface VoteState {
  [optionIndex: number]: number; // count per option
}

export interface Student {
  socketId: string;
  name: string;
  hasAnswered: boolean;
  answeredOptionIndex?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

// Events emitted by client, received by server
export interface ClientToServerEvents {
  'join-as-teacher': () => void;
  'join-as-student': (data: { name: string }) => void;
  'rejoin-as-student': (data: { name: string }) => void;
  'ask-question': (data: {
    text: string;
    options: SocketOption[];
    timer: number;
  }) => void;
  'submit-answer': (data: { optionIndex: number }) => void;
  'kick-student': (data: { studentId: string }) => void;
  'send-chat': (data: { message: string }) => void;
  'end-question': () => void;
}

// Events emitted by server, received by client
export interface ServerToClientEvents {
  'question-started': (data: {
    question: ActiveQuestion;
  }) => void;
  'vote-update': (data: {
    votes: VoteState;
    total: number;
    percentages: { [key: number]: number };
  }) => void;
  'question-ended': (data: {
    votes: VoteState;
    total: number;
    percentages: { [key: number]: number };
    correctAnswerIndex: number;
  }) => void;
  'you-are-kicked': () => void;
  'participants-update': (data: { participants: Array<{ id: string; name: string }> }) => void;
  'chat-message': (data: ChatMessage) => void;
  'error': (data: { message: string }) => void;
  'teacher-connected': () => void;
  'teacher-disconnected': () => void;
  'answer-accepted': (data: { optionIndex: number }) => void;
  'session-state': (data: {
    activeQuestion: ActiveQuestion | null;
    votes: VoteState;
    total: number;
    percentages: { [key: number]: number };
    chatMessages: ChatMessage[];
    participants: Array<{ id: string; name: string }>;
    hasAnswered?: boolean;
    answeredOptionIndex?: number;
  }) => void;
}
