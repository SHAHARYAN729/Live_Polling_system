import { v4 as uuidv4 } from 'uuid';
import {
  ActiveQuestion,
  VoteState,
  Student,
  ChatMessage,
  SocketOption,
} from '../types';
import { PollQuestion } from '../models/PollQuestion';

/* ── In-memory session state (single room) ── */
interface SessionState {
  teacherSocketId: string | null;
  students: Map<string, Student>;
  activeQuestion: ActiveQuestion | null;
  votes: VoteState;
  questionNumber: number;
  questionTimer: NodeJS.Timeout | null;
  sessionId: string;
  chatMessages: ChatMessage[];
}

const sessionState: SessionState = {
  teacherSocketId: null,
  students: new Map(),
  activeQuestion: null,
  votes: {},
  questionNumber: 0,
  questionTimer: null,
  sessionId: uuidv4(),
  chatMessages: [],
};

/* ── Pure helpers ── */
function getVotePercentages(votes: VoteState, total: number): { [key: number]: number } {
  const percentages: { [key: number]: number } = {};
  if (total === 0) return percentages;
  for (const key in votes) {
    percentages[key] = Math.round((votes[key] / total) * 100);
  }
  return percentages;
}

function getParticipantsList(): Array<{ id: string; name: string }> {
  return Array.from(sessionState.students.values()).map((s) => ({
    id: s.socketId,
    name: s.name,
  }));
}

function getSessionSnapshot(extra?: { hasAnswered?: boolean; answeredOptionIndex?: number }) {
  const total = Object.values(sessionState.votes).reduce((a, b) => a + b, 0);
  return {
    activeQuestion: sessionState.activeQuestion,
    votes: sessionState.votes,
    total,
    percentages: getVotePercentages(sessionState.votes, total),
    chatMessages: sessionState.chatMessages,
    participants: getParticipantsList(),
    ...extra,
  };
}

/* ── Service methods ── */

export function getTeacherSocketId(): string | null {
  return sessionState.teacherSocketId;
}

/**
 * Attempt to register a socket as the teacher.
 * Returns { ok: true } or { ok: false, reason: string }.
 */
export function joinAsTeacher(
  socketId: string,
  isOldSocketConnected: (id: string) => boolean,
): { ok: true; sessionSnapshot: ReturnType<typeof getSessionSnapshot> } | { ok: false; reason: string } {
  if (
    sessionState.teacherSocketId &&
    sessionState.teacherSocketId !== socketId
  ) {
    if (isOldSocketConnected(sessionState.teacherSocketId)) {
      return { ok: false, reason: 'A teacher is already connected.' };
    }
  }
  sessionState.teacherSocketId = socketId;
  return { ok: true, sessionSnapshot: getSessionSnapshot() };
}

/**
 * Register a student (new or rejoin).
 */
export function joinAsStudent(
  socketId: string,
  name: string,
  isRejoin: boolean,
): { ok: true; sessionSnapshot: ReturnType<typeof getSessionSnapshot> } | { ok: false; reason: string } {
  if (!name || name.trim().length === 0) {
    return { ok: false, reason: 'Name is required.' };
  }

  const trimmedName = name.trim().slice(0, 50);
  const student: Student = {
    socketId,
    name: trimmedName,
    hasAnswered: false,
  };
  sessionState.students.set(socketId, student);

  return {
    ok: true,
    sessionSnapshot: getSessionSnapshot({
      hasAnswered: isRejoin ? false : student.hasAnswered,
      answeredOptionIndex: isRejoin ? undefined : student.answeredOptionIndex,
    }),
  };
}

/**
 * Start a new question. Returns the ActiveQuestion or an error.
 */
export function askQuestion(
  socketId: string,
  text: string,
  options: SocketOption[],
  timer: number,
): { ok: true; question: ActiveQuestion } | { ok: false; reason: string } {
  if (socketId !== sessionState.teacherSocketId) {
    return { ok: false, reason: 'Only the teacher can ask questions.' };
  }
  if (sessionState.activeQuestion) {
    return { ok: false, reason: 'A question is already active. End it first.' };
  }
  if (!text || text.trim().length === 0) {
    return { ok: false, reason: 'Question text is required.' };
  }
  if (!options || options.length < 2) {
    return { ok: false, reason: 'At least 2 options are required.' };
  }

  const timerValue = Math.max(10, Math.min(60, timer || 60));
  sessionState.questionNumber += 1;

  const activeQuestion: ActiveQuestion = {
    id: uuidv4(),
    text: text.trim(),
    options,
    timer: timerValue,
    questionNumber: sessionState.questionNumber,
    startedAt: Date.now(),
  };

  sessionState.activeQuestion = activeQuestion;
  sessionState.votes = {};

  // Reset answered state
  sessionState.students.forEach((student) => {
    student.hasAnswered = false;
    student.answeredOptionIndex = undefined;
  });

  return { ok: true, question: activeQuestion };
}

/**
 * Set the auto-end timer reference (managed by the handler layer).
 */
export function setQuestionTimer(timer: NodeJS.Timeout | null) {
  sessionState.questionTimer = timer;
}

export function getQuestionTimer(): NodeJS.Timeout | null {
  return sessionState.questionTimer;
}

/**
 * Submit a student's answer. Returns vote snapshot or error.
 */
export function submitVote(
  socketId: string,
  optionIndex: number,
): { ok: true; voteSnapshot: { votes: VoteState; total: number; percentages: { [key: number]: number } }; allAnswered: boolean }
  | { ok: false; reason: string } {
  const student = sessionState.students.get(socketId);
  if (!student) {
    return { ok: false, reason: 'You are not registered as a student.' };
  }
  if (!sessionState.activeQuestion) {
    return { ok: false, reason: 'No active question.' };
  }
  if (student.hasAnswered) {
    return { ok: false, reason: 'You have already submitted an answer.' };
  }
  if (optionIndex < 0 || optionIndex >= sessionState.activeQuestion.options.length) {
    return { ok: false, reason: 'Invalid option.' };
  }

  student.hasAnswered = true;
  student.answeredOptionIndex = optionIndex;
  sessionState.votes[optionIndex] = (sessionState.votes[optionIndex] || 0) + 1;

  const total = Object.values(sessionState.votes).reduce((a, b) => a + b, 0);
  const percentages = getVotePercentages(sessionState.votes, total);

  const allAnswered =
    sessionState.students.size > 0 &&
    Array.from(sessionState.students.values()).every((s) => s.hasAnswered);

  return { ok: true, voteSnapshot: { votes: sessionState.votes, total, percentages }, allAnswered };
}

/**
 * End the current question, persist to DB, return final results.
 */
export function endCurrentQuestion(): {
  ended: true;
  results: { votes: VoteState; total: number; percentages: { [key: number]: number }; correctAnswerIndex: number };
} | { ended: false } {
  if (!sessionState.activeQuestion) return { ended: false };

  if (sessionState.questionTimer) {
    clearTimeout(sessionState.questionTimer);
    sessionState.questionTimer = null;
  }

  const total = Object.values(sessionState.votes).reduce((a, b) => a + b, 0);
  const percentages = getVotePercentages(sessionState.votes, total);
  const correctAnswerIndex = sessionState.activeQuestion.options.findIndex(
    (o: SocketOption) => o.isCorrect,
  );

  // Persist to DB (fire-and-forget, won't crash on DB failure)
  const q = sessionState.activeQuestion;
  const optionsWithVotes = q.options.map((opt: SocketOption, idx: number) => ({
    text: opt.text,
    isCorrect: opt.isCorrect,
    votes: sessionState.votes[idx] || 0,
  }));

  PollQuestion.create({
    text: q.text,
    options: optionsWithVotes,
    timer: q.timer,
    questionNumber: q.questionNumber,
    totalVotes: total,
    sessionId: sessionState.sessionId,
    endedAt: new Date(),
  }).catch((err: Error) => console.error('DB save error:', err));

  // Capture votes before clearing state
  const finalVotes = { ...sessionState.votes };

  sessionState.activeQuestion = null;
  sessionState.votes = {};

  sessionState.students.forEach((student) => {
    student.hasAnswered = false;
    student.answeredOptionIndex = undefined;
  });

  return { ended: true, results: { votes: finalVotes, total, percentages, correctAnswerIndex } };
}

/**
 * Kick a student. Returns the kicked student's name or error.
 */
export function kickStudent(
  teacherSocketId: string,
  studentId: string,
): { ok: true } | { ok: false; reason: string } {
  if (teacherSocketId !== sessionState.teacherSocketId) {
    return { ok: false, reason: 'Only the teacher can kick students.' };
  }
  const student = sessionState.students.get(studentId);
  if (!student) {
    return { ok: false, reason: 'Student not found.' };
  }
  sessionState.students.delete(studentId);
  return { ok: true };
}

/**
 * End a question manually (teacher only).
 */
export function endQuestionManually(
  socketId: string,
): { ok: true; results: ReturnType<typeof endCurrentQuestion> } | { ok: false; reason: string } {
  if (socketId !== sessionState.teacherSocketId) {
    return { ok: false, reason: 'Only the teacher can end questions.' };
  }
  if (!sessionState.activeQuestion) {
    return { ok: false, reason: 'No active question to end.' };
  }
  return { ok: true, results: endCurrentQuestion() };
}

/**
 * Send a chat message. Returns the ChatMessage or error.
 */
export function sendChatMessage(
  socketId: string,
  message: string,
): { ok: true; chatMsg: ChatMessage } | { ok: false; reason?: string } {
  if (!message || message.trim().length === 0) {
    return { ok: false };
  }

  const isTeacher = socketId === sessionState.teacherSocketId;
  const student = sessionState.students.get(socketId);

  if (!isTeacher && !student) {
    return { ok: false, reason: 'You must be joined to chat.' };
  }

  const senderName = isTeacher ? 'Teacher' : student!.name;
  const chatMsg: ChatMessage = {
    id: uuidv4(),
    senderId: socketId,
    senderName,
    message: message.trim().slice(0, 500),
    timestamp: Date.now(),
  };

  sessionState.chatMessages.push(chatMsg);
  return { ok: true, chatMsg };
}

/**
 * Handle a socket disconnecting.
 */
export function handleDisconnect(socketId: string): {
  wasTeacher: boolean;
  wasStudent: boolean;
  studentName?: string;
} {
  const wasTeacher = socketId === sessionState.teacherSocketId;
  if (wasTeacher) {
    sessionState.teacherSocketId = null;
  }

  let wasStudent = false;
  let studentName: string | undefined;
  if (sessionState.students.has(socketId)) {
    studentName = sessionState.students.get(socketId)!.name;
    sessionState.students.delete(socketId);
    wasStudent = true;
  }

  return { wasTeacher, wasStudent, studentName };
}

/**
 * Get the participants list for broadcasting.
 */
export function getParticipants(): Array<{ id: string; name: string }> {
  return getParticipantsList();
}
