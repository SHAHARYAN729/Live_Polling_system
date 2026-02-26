import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { kickStudent, sendChat } from '../store/socketMiddleware';
import type { Participant, ChatMessage } from '../types';

interface Props {
  onClose: () => void;
}

export function ChatParticipantsPanel({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const participants = useAppSelector((s) => s.chat.participants);
  const chatMessages = useAppSelector((s) => s.chat.chatMessages);
  const role = useAppSelector((s) => s.session.role);
  const socketId = useAppSelector((s) => s.session.socketId);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('participants');
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (!message.trim()) return;
    dispatch(sendChat(message.trim()));
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed bottom-24 right-8 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-medium text-center cursor-pointer transition-colors ${
              activeTab === 'chat'
                ? 'text-gray-900 border-b-2 border-[#6C3FE4]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex-1 py-3 text-sm font-medium text-center cursor-pointer transition-colors ${
              activeTab === 'participants'
                ? 'text-gray-900 border-b-2 border-[#6C3FE4]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Participants
          </button>
        </div>

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="max-h-80 overflow-y-auto">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500">Name</span>
              {role === 'teacher' && (
                <span className="text-xs font-medium text-gray-500">Action</span>
              )}
            </div>

            {participants.length === 0 && (
              <p className="px-5 py-4 text-xs text-gray-400">No participants yet.</p>
            )}

            {participants.map((p: Participant) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-5 py-3 border-b border-gray-50"
              >
                <span className="text-sm text-gray-800">{p.name}</span>
                {role === 'teacher' && (
                  <button
                    onClick={() => dispatch(kickStudent(p.id))}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    Kick out
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-80">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {chatMessages.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-4">No messages yet.</p>
              )}
              {chatMessages.map((msg: ChatMessage) => {
                const isMe = msg.senderId === socketId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className={`text-xs font-semibold mb-0.5 ${
                      isMe ? 'text-[#6C3FE4]' : 'text-red-500'
                    }`}>{msg.senderName}</span>
                    <div
                      className={`px-3 py-2 rounded-lg text-sm max-w-[80%] ${
                        isMe
                          ? 'bg-[#6C3FE4] text-white'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 px-3 py-2 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded-lg outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="px-4 py-2 bg-[#6C3FE4] text-white text-sm rounded-lg font-medium disabled:bg-gray-300 cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
