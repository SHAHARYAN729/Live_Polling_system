import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Phase, Role } from '../../types';

interface SessionState {
  role: Role | null;
  studentName: string;
  phase: Phase;
  isConnected: boolean;
  teacherOnline: boolean;
  socketId: string | null;
}

const initialState: SessionState = {
  role: (sessionStorage.getItem('poll_role') as Role) || null,
  studentName: sessionStorage.getItem('poll_student_name') || '',
  phase: (sessionStorage.getItem('poll_phase') as Phase) || 'role-select',
  isConnected: false,
  teacherOnline: false,
  socketId: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setRole(state, action: PayloadAction<Role | null>) {
      state.role = action.payload;
      if (action.payload) {
        sessionStorage.setItem('poll_role', action.payload);
      } else {
        sessionStorage.removeItem('poll_role');
      }
    },
    setStudentName(state, action: PayloadAction<string>) {
      state.studentName = action.payload;
      if (action.payload) {
        sessionStorage.setItem('poll_student_name', action.payload);
      } else {
        sessionStorage.removeItem('poll_student_name');
      }
    },
    setPhase(state, action: PayloadAction<Phase>) {
      state.phase = action.payload;
      sessionStorage.setItem('poll_phase', action.payload);
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },
    setTeacherOnline(state, action: PayloadAction<boolean>) {
      state.teacherOnline = action.payload;
    },
    setSocketId(state, action: PayloadAction<string | null>) {
      state.socketId = action.payload;
    },
    resetSession(state) {
      state.role = null;
      state.studentName = '';
      state.phase = 'role-select';
      state.teacherOnline = false;
      state.socketId = null;
      sessionStorage.removeItem('poll_role');
      sessionStorage.removeItem('poll_student_name');
      sessionStorage.setItem('poll_phase', 'role-select');
    },
  },
});

export const {
  setRole,
  setStudentName,
  setPhase,
  setConnected,
  setTeacherOnline,
  setSocketId,
  resetSession,
} = sessionSlice.actions;

export default sessionSlice.reducer;
