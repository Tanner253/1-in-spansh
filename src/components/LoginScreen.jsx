import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import RoadmapSection from './RoadmapCards';

const CA = '4Y4utzQGRtJs24XrdbwCHJyDoCt4NXucTwACofAapump';

function TokenPopup({ onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(CA).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-slate-800 border border-[#9945FF]/40 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🪙</div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
            SOLUNO Platform Token
          </h2>
        </div>
        <p className="text-slate-400 text-sm text-center leading-relaxed mb-5">
          Supporting the SOLUNO token helps fund development, new features, tournaments, and the expansion of the platform. Thank you for being part of the community.
        </p>
        <div className="bg-slate-900 rounded-xl p-3 mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-semibold">Contract Address</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-[#14F195] break-all font-mono leading-relaxed">{CA}</code>
            <button
              onClick={copy}
              className="shrink-0 px-3 py-1.5 bg-[#9945FF]/20 hover:bg-[#9945FF]/30 text-[#14F195] text-xs font-bold rounded-lg transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default function LoginScreen() {
  const { login } = useGame();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = username.trim();
    if (name.length < 1 || loading) return;
    setLoading(true);
    login(name);
  };

  return (
    <div className="min-h-screen px-4 py-12 md:py-20">
      {showToken && <TokenPopup onClose={() => setShowToken(false)} />}

      <div className="max-w-md mx-auto mb-16">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black tracking-tight mb-2">
            <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">S</span>
            <span className="bg-gradient-to-r from-[#14F195] to-[#00D18C] bg-clip-text text-transparent">O</span>
            <span className="bg-gradient-to-r from-[#00D18C] to-[#14F195] bg-clip-text text-transparent">L</span>
            <span className="text-red-500">U</span>
            <span className="text-blue-500">N</span>
            <span className="text-green-500">O</span>
          </h1>
          <p className="text-slate-400 text-lg">Multiplayer PVP on Solana</p>
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
            disabled={!username.trim() || loading}
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </span>
            ) : 'Play Now'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Create or join a lobby to play UNO with up to 8 players
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <RoadmapSection />
      </div>

      <footer className="max-w-md mx-auto mt-16 mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href="https://x.com/i/communities/2037238275539427836"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 hover:shadow-lg w-full sm:w-auto justify-center"
          style={{ background: 'linear-gradient(135deg, #ff3333, #ff6b81)', boxShadow: '0 4px 20px rgba(255,51,51,0.3)' }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Join Community
        </a>
        <a
          href="https://github.com/Tanner253/1-in-spansh"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 hover:shadow-lg w-full sm:w-auto justify-center"
          style={{ background: 'linear-gradient(135deg, #1155ff, #00aaff)', boxShadow: '0 4px 20px rgba(17,85,255,0.3)' }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
          View Source
        </a>
      </footer>
    </div>
  );
}
