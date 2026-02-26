export interface SocketOption {
  text: string;
  isCorrect: boolean;
}

export interface ActiveQuestion {
  id: string;
  text: string;
  options: SocketOption[];
  timer: number;
  questionNumber: number;
  startedAt: number;
}

export interface VoteState {
  [optionIndex: number]: number;
}

export interface Participant {
  id: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export interface QuestionEndData {
  votes: VoteState;
  total: number;
  percentages: { [key: number]: number };
  correctAnswerIndex: number;
  options?: SocketOption[];
  questionText?: string;
  questionNumber?: number;
}

export interface PollHistoryItem {
  _id: string;
  text: string;
  options: { text: string; isCorrect: boolean; votes: number }[];
  timer: number;
  questionNumber: number;
  totalVotes: number;
  sessionId: string;
  createdAt: string;
  endedAt?: string;
}

export type Role = 'student' | 'teacher';

export type Phase =
  | 'role-select'
  | 'student-name'
  | 'student-connecting'
  | 'student-waiting'
  | 'student-question'
  | 'student-answered'
  | 'student-kicked'
  | 'teacher-create'
  | 'teacher-active'
  | 'teacher-results'
  | 'poll-history';
