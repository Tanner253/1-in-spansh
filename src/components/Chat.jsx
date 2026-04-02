import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';

export default function Chat({ compact = false }) {
  const { chatMessages, sendChat, playerId } = useGame();
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendChat(text.trim());
    setText('');
  };

  return (
    <div className={`flex flex-col bg-slate-800/60 backdrop-blur rounded-xl border border-slate-700/50 ${compact ? 'h-48' : 'h-80'}`}>
      <div className="px-3 py-2 border-b border-slate-700/50">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Chat</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 text-sm">
        {chatMessages.length === 0 && (
          <p className="text-slate-600 text-xs text-center mt-4">No messages yet</p>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id}>
            <span className={`font-medium ${msg.playerId === playerId ? 'text-indigo-400' : 'text-slate-300'}`}>
              {msg.playerName}
            </span>
            <span className="text-slate-500">: </span>
            <span className="text-slate-300">{msg.text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-2 border-t border-slate-700/50 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          maxLength={200}
          className="flex-1 px-3 py-1.5 bg-slate-900/60 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm rounded-lg transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
