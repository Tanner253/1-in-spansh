import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';

export default function LoginScreen() {
  const { login } = useGame();
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = username.trim();
    if (name.length < 1) return;
    login(name);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black tracking-tight mb-2">
            <span className="text-red-500">U</span>
            <span className="text-blue-500">N</span>
            <span className="text-green-500">O</span>
          </h1>
          <p className="text-slate-400 text-lg">Multiplayer PVP</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/60 backdrop-blur rounded-2xl p-8 border border-slate-700/50">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Choose your username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username..."
            maxLength={20}
            autoFocus
            className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-lg"
          />
          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            Play
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Create or join a lobby to play UNO with friends
        </p>
      </div>
    </div>
  );
}
