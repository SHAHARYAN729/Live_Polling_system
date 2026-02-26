import { useState } from 'react';
import { Logo } from '../components/Logo';
import { ChatParticipantsPanel } from '../components/ChatParticipantsPanel';
import { Loader2, MessageSquare } from 'lucide-react';

export default function StudentWaitingPage() {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 relative">
      <Logo size="md" />

      <div className="mt-8">
        <Loader2 className="w-12 h-12 text-[#6C3FE4] animate-spin" />
      </div>

      <h2 className="mt-6 text-xl font-bold text-gray-900">
        Wait for the teacher to ask questions..
      </h2>

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
