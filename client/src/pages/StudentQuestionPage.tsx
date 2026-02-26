import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { submitAnswer } from '../store/socketMiddleware';
import { ChatParticipantsPanel } from '../components/ChatParticipantsPanel';
import { usePollTimer, formatTime } from '../hooks/usePollTimer';
import { MessageSquare, Timer } from 'lucide-react';

export default function StudentQuestionPage() {
  const dispatch = useAppDispatch();
  const activeQuestion = useAppSelector((s) => s.poll.activeQuestion);
  const percentages = useAppSelector((s) => s.poll.percentages);
  const lastAnsweredIndex = useAppSelector((s) => s.poll.lastAnsweredIndex);
  const questionEndData = useAppSelector((s) => s.poll.questionEndData);
  const phase = useAppSelector((s) => s.session.phase);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const remaining = usePollTimer(activeQuestion?.startedAt, activeQuestion?.timer);

  // Reset local selection when a new question arrives
  useEffect(() => {
    setSelectedOption(null);
  }, [activeQuestion?.id]);

  if (!activeQuestion && !questionEndData) {
    return null;
  }

  const showResults = phase === 'student-answered' && questionEndData !== null;
  const hasAnswered = lastAnsweredIndex !== null;
  const question = activeQuestion;
  const displayOptions = question?.options ?? questionEndData?.options ?? [];
  const questionText = question?.text ?? questionEndData?.questionText ?? '';
  const questionNum = question?.questionNumber ?? questionEndData?.questionNumber ?? '';

  const handleSelect = (idx: number) => {
    if (hasAnswered || showResults) return;
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null || hasAnswered) return;
    dispatch(submitAnswer(selectedOption));
  };

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center">
      <div className="w-full max-w-3xl px-8 py-10">
        {/* Question label + timer */}
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">Question {questionNum}</h2>
          {remaining !== null && remaining > 0 && !showResults && (
            <div className="flex items-center gap-1.5">
              <Timer size={18} className="text-gray-600" />
              <span className={`text-base font-bold ${remaining <= 10 ? 'text-red-500' : 'text-gray-700'}`}>
                {formatTime(remaining)}
              </span>
            </div>
          )}
        </div>

        {/* Question card - same style as teacher views */}
        <div className="mt-3 rounded-xl border border-[#6C3FE4]/30 overflow-hidden shadow-sm">
          {/* Dark header */}
          <div className="bg-[#4A4A4A] px-5 py-3">
            <p className="text-white text-sm font-medium">{questionText}</p>
          </div>

          {/* Options with bars */}
          <div className="p-4 space-y-3">
            {displayOptions.map((opt: { text: string; isCorrect: boolean }, idx: number) => {
              const pct = showResults
                ? (questionEndData?.percentages[idx] || 0)
                : hasAnswered
                  ? (percentages[idx] || 0)
                  : 0;
              const isSelected = selectedOption === idx || lastAnsweredIndex === idx;
              const showBar = hasAnswered || showResults;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={hasAnswered || showResults}
                  className={`w-full flex items-center gap-3 cursor-pointer disabled:cursor-default transition-all ${
                    hasAnswered || showResults ? '' : 'hover:opacity-80'
                  }`}
                >
                  <div className={`flex-1 relative rounded h-11 overflow-hidden border transition-all ${
                    isSelected
                      ? 'border-[#6C3FE4] border-2'
                      : 'border-[#6C3FE4]/20'
                  } bg-gray-100`}>
                    {showBar && (
                      <div
                        className="absolute inset-y-0 left-0 bg-[#6C3FE4] transition-all duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <div className="relative flex items-center h-full px-3 gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#6C3FE4] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-800 z-10">{opt.text}</span>
                    </div>
                  </div>
                  {showBar && (
                    <span className="w-12 text-right text-sm font-bold text-gray-700">{pct}%</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        {!hasAnswered && !showResults && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="w-48 py-3 bg-[#6C3FE4] hover:bg-[#5B31CC] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full font-semibold text-sm transition-colors cursor-pointer"
            >
              Submit
            </button>
          </div>
        )}

        {/* After submitting - waiting for results */}
        {hasAnswered && !showResults && (
          <p className="mt-8 text-center text-base font-bold text-gray-900">
            Wait for the teacher to ask a new question..
          </p>
        )}

        {/* Results */}
        {showResults && (
          <p className="mt-8 text-center text-base font-bold text-gray-900">
            Wait for the teacher to ask a new question..
          </p>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#6C3FE4] hover:bg-[#5B31CC] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors z-40"
      >
        <MessageSquare size={22} />
      </button>

      {/* Chat Panel */}
      {showPanel && (
        <ChatParticipantsPanel onClose={() => setShowPanel(false)} />
      )}
    </div>
  );
}
