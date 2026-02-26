import './App.css';
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setRole, setPhase } from './store/slices/sessionSlice';
import { connectAsTeacher } from './store/socketMiddleware';
import StudentNamePage from './pages/StudentNamePage';
import StudentWaitingPage from './pages/StudentWaitingPage';
import StudentQuestionPage from './pages/StudentQuestionPage';
import StudentKickedPage from './pages/StudentKickedPage';
import TeacherCreatePage from './pages/TeacherCreatePage';
import TeacherActivePage from './pages/TeacherActivePage';
import TeacherResultsPage from './pages/TeacherResultsPage';
import PollHistoryPage from './pages/PollHistoryPage';
import { Logo } from './components/Logo';
import type { Phase, Role } from './types';

/* ── phase → route mapping ── */
const PHASE_ROUTES: Record<Phase, string> = {
  'role-select': '/',
  'student-name': '/student',
  'student-connecting': '/student/waiting',
  'student-waiting': '/student/waiting',
  'student-question': '/student/question',
  'student-answered': '/student/question',
  'student-kicked': '/student/kicked',
  'teacher-create': '/teacher',
  'teacher-active': '/teacher/active',
  'teacher-results': '/teacher/results',
  'poll-history': '/teacher/history',
};

/** Keeps the browser URL in sync with the current phase */
function PhaseNavigator() {
  const phase: Phase = useAppSelector((s) => s.session.phase);
  const navigate = useNavigate();

  useEffect(() => {
    const target = PHASE_ROUTES[phase] || '/';
    navigate(target, { replace: true });
  }, [phase, navigate]);

  return null;
}

function RoleSelectPage() {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<Role | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    if (selected === 'teacher') {
      dispatch(connectAsTeacher());
    } else {
      dispatch(setRole('student'));
      dispatch(setPhase('student-name'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <Logo size="md" />

      <h1 className="mt-6 text-4xl font-light text-gray-900">
        Welcome to the <span className="font-bold">Live Polling System</span>
      </h1>
      <p className="mt-3 text-gray-400 text-sm text-center max-w-lg">
        Please select the role that best describes you to begin using the live polling system
      </p>

      <div className="mt-10 flex gap-6">
        {/* Student Card */}
        <button
          onClick={() => setSelected('student')}
          className={`w-72 text-left p-6 rounded-xl border-2 transition-all cursor-pointer ${
            selected === 'student'
              ? 'border-[#6C3FE4] shadow-md'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <h3 className="text-lg font-bold text-gray-900">I'm a Student</h3>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            Submit your answers, participate in live polls, and see real-time results alongside your classmates.
          </p>
        </button>

        {/* Teacher Card */}
        <button
          onClick={() => setSelected('teacher')}
          className={`w-72 text-left p-6 rounded-xl border-2 transition-all cursor-pointer ${
            selected === 'teacher'
              ? 'border-[#6C3FE4] shadow-md'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <h3 className="text-lg font-bold text-gray-900">I'm a Teacher</h3>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            Create and manage polls, ask questions, and monitor your students' responses in real-time.
          </p>
        </button>
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected}
        className="mt-10 w-48 py-3.5 bg-[#6C3FE4] hover:bg-[#5B31CC] disabled:bg-[#6C3FE4]/50 disabled:cursor-not-allowed text-white rounded-full font-semibold text-sm transition-colors cursor-pointer"
      >
        Continue
      </button>
    </div>
  );
}

export default function App() {
  return (
    <>
      <PhaseNavigator />
      <Routes>
        <Route path="/" element={<RoleSelectPage />} />
        <Route path="/student" element={<StudentNamePage />} />
        <Route path="/student/waiting" element={<StudentWaitingPage />} />
        <Route path="/student/question" element={<StudentQuestionPage />} />
        <Route path="/student/kicked" element={<StudentKickedPage />} />
        <Route path="/teacher" element={<TeacherCreatePage />} />
        <Route path="/teacher/active" element={<TeacherActivePage />} />
        <Route path="/teacher/results" element={<TeacherResultsPage />} />
        <Route path="/teacher/history" element={<PollHistoryPage />} />
        <Route path="*" element={<RoleSelectPage />} />
      </Routes>
    </>
  );
}