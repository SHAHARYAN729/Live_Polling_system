import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPhase } from '../store/slices/sessionSlice';
import { setQuestionEndData } from '../store/slices/pollSlice';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { ChatParticipantsPanel } from '../components/ChatParticipantsPanel';
import type { PollHistoryItem } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export default function PollHistoryPage() {
  const dispatch = useAppDispatch();
  const activeQuestion = useAppSelector((s) => s.poll.activeQuestion);
  const [history, setHistory] = useState<PollHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${SERVER_URL}/api/history`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHistory([...data.data].reverse());
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-white relative flex justify-center">
      <div className="w-full max-w-3xl px-8 py-10">
        {/* Back button */}
        <button
          onClick={() => {
            // Navigate back to active question if one is running, otherwise to create
            dispatch(setPhase(activeQuestion ? 'teacher-active' : 'teacher-create'));
            dispatch(setQuestionEndData(null));
          }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-3xl font-light text-gray-900">
          View <span className="font-bold">Poll History</span>
        </h1>

        {loading && (
          <p className="mt-8 text-gray-400 text-sm">Loading poll history...</p>
        )}

        {!loading && history.length === 0 && (
          <p className="mt-8 text-gray-400 text-sm">No polls found yet.</p>
        )}

        <div className="mt-8 space-y-10">
          {history.map((item, qIdx) => {
            const total = item.totalVotes || 1;
            return (
              <div key={item._id}>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Question {qIdx + 1}
                </h3>

                <div className="rounded-xl border border-[#6C3FE4]/30 overflow-hidden shadow-sm">
                  {/* Dark header */}
                  <div className="bg-[#4A4A4A] px-5 py-3">
                    <p className="text-white text-sm font-medium">{item.text}</p>
                  </div>

                  {/* Options */}
                  <div className="p-4 space-y-3">
                    {item.options.map((opt, idx) => {
                      const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex-1 relative bg-gray-100 rounded h-11 overflow-hidden border border-[#6C3FE4]/20">
                            <div
                              className="absolute inset-y-0 left-0 bg-[#6C3FE4]"
                              style={{ width: `${pct}%` }}
                            />
                            <div className="relative flex items-center h-full px-3 gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#6C3FE4] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {idx + 1}
                              </div>
                              <span className="text-sm font-medium text-gray-800 z-10">
                                {opt.text}
                              </span>
                            </div>
                          </div>
                          <span className="w-12 text-right text-sm font-bold text-gray-700">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#6C3FE4] hover:bg-[#5B31CC] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors z-40"
      >
        <MessageSquare size={22} />
      </button>

      {showPanel && (
        <ChatParticipantsPanel onClose={() => setShowPanel(false)} />
      )}
    </div>
  );
}
