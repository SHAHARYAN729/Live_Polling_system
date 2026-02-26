import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';
import * as PollService from '../services/PollService';

type IoType = Server<ClientToServerEvents, ServerToClientEvents>;
type SocketType = Socket<ClientToServerEvents, ServerToClientEvents>;

/* ── Thin I/O helpers ── */

function broadcastParticipants(io: IoType) {
  io.emit('participants-update', { participants: PollService.getParticipants() });
}

function broadcastEndQuestion(io: IoType) {
  const result = PollService.endCurrentQuestion();
  if (result.ended) {
    io.emit('question-ended', result.results);
  }
}

/* ── Socket handler registration ── */

export function registerSocketHandlers(io: IoType, socket: SocketType) {
  console.log(`✅ Socket connected: ${socket.id}`);
  console.log(`📊 Connected clients: ${io.engine.clientsCount}`);

  // Log disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id} (reason: ${reason})`);
    console.log(`📊 Connected clients: ${io.engine.clientsCount}`);
  });

  // Log connection errors
  socket.on('error', (error) => {
    console.error(`⚠️  Socket error for ${socket.id}:`, error);
  });

  // ─── JOIN AS TEACHER ─────────────────────────────────────────────────
  socket.on('join-as-teacher', () => {
    const result = PollService.joinAsTeacher(socket.id, (oldId) => {
      const oldSocket = io.sockets.sockets.get(oldId);
      return !!oldSocket?.connected;
    });

    if (!result.ok) {
      socket.emit('error', { message: result.reason });
      return;
    }

    socket.join('room');
    console.log(`Teacher joined: ${socket.id}`);

    io.to('room').emit('teacher-connected');
    socket.emit('session-state', result.sessionSnapshot);
  });

  // ─── JOIN AS STUDENT ─────────────────────────────────────────────────
  socket.on('join-as-student', ({ name }) => {
    const result = PollService.joinAsStudent(socket.id, name, false);
    if (!result.ok) {
      socket.emit('error', { message: result.reason });
      return;
    }

    socket.join('room');
    console.log(`Student joined: ${name} (${socket.id})`);
    broadcastParticipants(io);
    socket.emit('session-state', result.sessionSnapshot);
  });

  // ─── REJOIN AS STUDENT (after refresh) ───────────────────────────────
  socket.on('rejoin-as-student', ({ name }) => {
    const result = PollService.joinAsStudent(socket.id, name, true);
    if (!result.ok) {
      socket.emit('error', { message: result.reason });
      return;
    }

    socket.join('room');
    console.log(`Student rejoined: ${name} (${socket.id})`);
    broadcastParticipants(io);
    socket.emit('session-state', result.sessionSnapshot);
  });

  // ─── ASK QUESTION ───────────────────────────────────────────────────
  socket.on('ask-question', ({ text, options, timer }) => {
    const result = PollService.askQuestion(socket.id, text, options, timer);
    if (!result.ok) {
      socket.emit('error', { message: result.reason });
      return;
    }

    io.to('room').emit('question-started', { question: result.question });

    // Auto-end timer (I/O concern — stays in handler)
    const timeout = setTimeout(() => broadcastEndQuestion(io), result.question.timer * 1000);
    PollService.setQuestionTimer(timeout);

    console.log(`Question asked: "${text}" (timer: ${result.question.timer}s)`);
  });

  // ─── SUBMIT ANSWER ──────────────────────────────────────────────────
  socket.on('submit-answer', ({ optionIndex }) => {
    const result = PollService.submitVote(socket.id, optionIndex);
    if (!result.ok) {
      socket.emit('error', { message: result.reason });
      return;
    }

    socket.emit('answer-accepted', { optionIndex });
    io.to('room').emit('vote-update', result.voteSnapshot);

    if (result.allAnswered) {
      console.log('All students have answered — auto-ending question.');
      broadcastEndQuestion(io);
    }
  });

  // ─── KICK STUDENT ───────────────────────────────────────────────────
  socket.on('kick-student', ({ studentId }) => {
    const result = PollService.kickStudent(socket.id, studentId);
    if (!result.ok) {
      socket.emit('error', { message: result.reason });
      return;
    }

    io.to(studentId).emit('you-are-kicked');
    broadcastParticipants(io);
    console.log(`Student kicked: ${studentId}`);
  });

  // ─── END QUESTION MANUALLY ──────────────────────────────────────────
  socket.on('end-question', () => {
    const result = PollService.endQuestionManually(socket.id);
    if (!result.ok) {
      socket.emit('error', { message: result.reason });
      return;
    }
    // endCurrentQuestion was already called inside endQuestionManually,
    // but we need to broadcast — reuse broadcastEndQuestion pattern:
    // Actually endQuestionManually already called endCurrentQuestion,
    // so we just need to emit the results.
    if (result.results.ended) {
      io.emit('question-ended', result.results.results);
    }
  });

  // ─── CHAT ───────────────────────────────────────────────────────────
  socket.on('send-chat', ({ message }) => {
    const result = PollService.sendChatMessage(socket.id, message);
    if (!result.ok) {
      if (result.reason) socket.emit('error', { message: result.reason });
      return;
    }
    io.to('room').emit('chat-message', result.chatMsg);
  });

  // ─── DISCONNECT ─────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);

    const { wasTeacher, wasStudent, studentName } = PollService.handleDisconnect(socket.id);

    if (wasTeacher) {
      io.to('room').emit('teacher-disconnected');
      console.log('Teacher disconnected (state preserved for reconnection)');
    }

    if (wasStudent) {
      broadcastParticipants(io);
      console.log(`Student left: ${studentName}`);
    }
  });
}
