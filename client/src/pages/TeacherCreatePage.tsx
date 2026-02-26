import { useState } from 'react';
import { Logo } from '../components/Logo';
import { useAppDispatch } from '../store/hooks';
import { askQuestion } from '../store/socketMiddleware';
import { toast } from 'sonner';
import type { SocketOption } from '../types';

const TIMER_OPTIONS = [15, 30, 45, 60];

export default function TeacherCreatePage() {
  const dispatch = useAppDispatch();
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<SocketOption[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ]);
  const [timer, setTimer] = useState(60);

  const handleOptionChange = (idx: number, text: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, text } : o)));
  };

  const handleCorrectChange = (idx: number, isCorrect: boolean) => {
    setOptions((prev) =>
      prev.map((o, i) => {
        if (i === idx) return { ...o, isCorrect };
        if (isCorrect) return { ...o, isCorrect: false };
        return o;
      })
    );
  };

  const addOption = () => {
    if (options.length >= 6) {
      toast.warning('Maximum 6 options allowed.');
      return;
    }
    setOptions((prev) => [...prev, { text: '', isCorrect: false }]);
  };

  const handleAsk = () => {
    const trimmedQuestion = questionText.trim();
    if (!trimmedQuestion) {
      toast.error('Please enter a question.');
      return;
    }

    const filledOptions = options.filter((o) => o.text.trim().length > 0);
    if (filledOptions.length < 2) {
      toast.error('At least 2 options must be filled.');
      return;
    }

    const hasCorrect = filledOptions.some((o) => o.isCorrect);
    if (!hasCorrect) {
      toast.error('Please mark a correct answer.');
      return;
    }

    dispatch(askQuestion({
      text: trimmedQuestion,
      options: filledOptions,
      timer,
    }));

    setQuestionText('');
    setOptions([
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ]);
  };

  return (
    <div className="h-screen bg-white overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-6">
        {/* Logo */}
        <Logo size="md" />

        {/* Header */}
        <h1 className="mt-3 text-3xl font-light text-gray-900">
          Let's <span className="font-bold">Get Started</span>
        </h1>
        <p className="mt-1.5 text-gray-400 text-sm leading-relaxed max-w-xl">
          you'll have the ability to create and manage polls, ask questions, and monitor
          your students' responses in real-time.
        </p>

        {/* Question Input */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-gray-900">Enter your question</h3>
            <div className="relative">
              <select
                value={timer}
                onChange={(e) => setTimer(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-2 pr-8 text-sm font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6C3FE4]/30"
              >
                {TIMER_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t} seconds
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6C3FE4]">
                ▾
              </span>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={questionText}
              onChange={(e) => {
                if (e.target.value.length <= 100) setQuestionText(e.target.value);
              }}
              placeholder="Type your question here..."
              rows={3}
              className="w-full px-5 py-4 bg-[#F5F5F5] rounded-xl border-none outline-none text-gray-800 placeholder:text-gray-400 resize-none text-sm"
            />
            <span className="absolute bottom-3 right-4 text-xs text-gray-400">
              {questionText.length}/100
            </span>
          </div>
        </div>

        {/* Options */}
        <div className="mt-5">
          <div className="flex items-start">
            <h3 className="text-base font-bold text-gray-900 w-[60%]">Edit Options</h3>
            <h3 className="text-base font-bold text-gray-900">Is it Correct?</h3>
          </div>

          <div className="mt-3 space-y-3">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-[#6C3FE4] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  maxLength={200}
                  className="flex-1 px-4 py-3 bg-[#F5F5F5] rounded-lg border-none outline-none text-gray-800 placeholder:text-gray-400 text-sm max-w-[50%]"
                />
                <div className="flex items-center gap-4 ml-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={`correct-${idx}`}
                      checked={opt.isCorrect}
                      onChange={() => handleCorrectChange(idx, true)}
                      className="w-4 h-4 accent-[#6C3FE4]"
                    />
                    <span className="text-sm font-medium text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={`correct-${idx}`}
                      checked={!opt.isCorrect}
                      onChange={() => handleCorrectChange(idx, false)}
                      className="w-4 h-4 accent-[#6C3FE4]"
                    />
                    <span className="text-sm font-medium text-gray-700">No</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <button
              onClick={addOption}
              className="mt-4 px-5 py-2 border border-[#6C3FE4] text-[#6C3FE4] rounded-full text-sm font-medium hover:bg-[#6C3FE4]/5 transition-colors cursor-pointer"
            >
              + Add More option
            </button>
          )}
        </div>

        {/* Divider + Ask Button */}
        <div className="mt-6 border-t border-gray-200 pt-4 flex justify-end">
          <button
            onClick={handleAsk}
            className="px-8 py-3 bg-[#6C3FE4] hover:bg-[#5B31CC] text-white rounded-full font-semibold text-sm transition-colors cursor-pointer"
          >
            Ask Question
          </button>
        </div>
      </div>
    </div>
  );
}
