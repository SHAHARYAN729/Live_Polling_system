import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPhase } from '../store/slices/sessionSlice';
import { endQuestion } from '../store/socketMiddleware';
import { ChatParticipantsPanel } from '../components/ChatParticipantsPanel';
import { usePollTimer, formatTime } from '../hooks/usePollTimer';
import { MessageSquare, Timer } from 'lucide-react';
import type { SocketOption } from '../types';

export default function TeacherActivePage() {
  const dispatch = useAppDispatch();
  const activeQuestion = useAppSelector((s) => s.poll.activeQuestion);
  const totalVotes = useAppSelector((s) => s.poll.totalVotes);
  const percentages = useAppSelector((s) => s.poll.percentages);
  const [showPanel, setShowPanel] = useState(false);

  const question = activeQuestion;
  const remaining = usePollTimer(question?.startedAt, question?.timer);

  if (!question) return null;

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center">
      <div className="w-full max-w-3xl px-8 py-10">
        {/* Top bar with View Poll History */}
        <div className="flex justify-between items-center">
          <div />
          <button
            onClick={() => dispatch(setPhase('poll-history'))}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#6C3FE4] text-white rounded-full text-sm font-semibold cursor-pointer hover:bg-[#5B31CC] transition-colors"
          >
            <span className="text-base">👁</span>
            View Poll history
          </button>
        </div>

        {/* Timer */}

        {/* Question label */}
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">Question {question.questionNumber}</h2>
          {remaining !== null && remaining > 0 && (
            <div className="flex items-center gap-1.5">
              <Timer size={18} className="text-gray-600" />
              <span className={`text-base font-bold ${remaining <= 10 ? 'text-red-500' : 'text-gray-700'}`}>
                {formatTime(remaining)}
              </span>
            </div>
          )}
        </div>

        {/* Question card */}
        <div className="mt-3 rounded-xl border border-[#6C3FE4]/30 overflow-hidden shadow-sm">
          {/* Dark header */}
          <div className="bg-[#4A4A4A] px-5 py-3">
            <p className="text-white text-sm font-medium">{question.text}</p>
          </div>

          {/* Options with bars */}
          <div className="p-4 space-y-3">
            {question.options.map((opt: SocketOption, idx: number) => {
              const pct = percentages[idx] || 0;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1 relative bg-gray-100 rounded h-11 overflow-hidden border border-[#6C3FE4]/20">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#6C3FE4] transition-all duration-700 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center h-full px-3 gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#6C3FE4] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-800 z-10">{opt.text}</span>
                    </div>
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-gray-700">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''} received
          </p>
          <button
            onClick={() => dispatch(endQuestion())}
            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold text-sm transition-colors cursor-pointer"
          >
            End Question
          </button>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#6C3FE4] hover:bg-[#5B31CC] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors z-40"
      >
        <MessageSquare size={22} />
      </button>

      {/* Chat/Participants Panel */}
      {showPanel && (
        <ChatParticipantsPanel onClose={() => setShowPanel(false)} />
      )}
    </div>
  );
}
