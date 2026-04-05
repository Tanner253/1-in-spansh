import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';

const CA = '4Y4utzQGRtJs24XrdbwCHJyDoCt4NXucTwACofAapump';

const ROADMAP = [
  { color: '#ff3333', title: 'SOL Wagers', tag: 'Up Next', desc: 'Wager SOL or any Solana token head-to-head. Winner takes the pot.' },
  { color: '#9945FF', title: 'Tournaments', tag: 'Coming Soon', desc: 'Bracket-style tournaments with pooled SOL prize pots. Weekly & monthly events.' },
  { color: '#14F195', title: 'NFT Card Skins', tag: 'Coming Soon', desc: 'Collect and trade custom card backs — holographic, animated, gold.' },
  { color: '#ff6b81', title: 'Spectate + Predict', tag: 'Coming Soon', desc: 'Watch live games, predict the winner, earn tokens from the pool.' },
  { color: '#1155ff', title: 'On-Chain Leaderboard', tag: 'Coming Soon', desc: 'Seasonal rankings on Solana. Top players earn SOL airdrops & NFT trophies.' },
  { color: '#ff9500', title: 'VIP Token-Gated Tables', tag: 'Coming Soon', desc: 'Hold NFTs or tokens to unlock exclusive high-stakes lobbies.' },
  { color: '#00aaff', title: 'Daily Challenges', tag: 'Coming Soon', desc: 'Complete tasks — "Win 3 games," "Play 5 reverses" — earn reward tokens.' },
];

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

function RoadmapCard({ item, index, total }) {
  const [flipped, setFlipped] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const fanAngle = (index - (total - 1) / 2) * 8;
  const fanY = Math.abs(index - (total - 1) / 2) * 6;

  return (
    <div
      className="relative cursor-pointer"
      style={{
        transform: `rotate(${fanAngle}deg) translateY(${fanY}px)`,
        transformOrigin: 'bottom center',
        zIndex: flipped ? 50 : total - Math.abs(index - Math.floor(total / 2)),
        transition: 'transform 0.3s ease, z-index 0s',
      }}
      onMouseEnter={() => !isMobile && setFlipped(true)}
      onMouseLeave={() => !isMobile && setFlipped(false)}
      onClick={() => isMobile && setFlipped(!flipped)}
    >
      <div
        className="relative w-36 sm:w-40 h-52 sm:h-56 transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg) translateY(-20px) scale(1.1)' : '',
        }}
      >
        {/* Front (card back) */}
        <div
          className="absolute inset-0 rounded-xl border-2 flex flex-col items-center justify-center gap-2 backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            background: `linear-gradient(135deg, ${item.color}33, ${item.color}11)`,
            borderColor: `${item.color}66`,
          }}
        >
          <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: item.color }}
          >
            <span className="text-2xl font-black" style={{ color: item.color }}>S</span>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.tag}</span>
          <span className="text-sm font-bold text-white px-2 text-center">{item.title}</span>
        </div>

        {/* Back (info) */}
        <div
          className="absolute inset-0 rounded-xl border-2 p-4 flex flex-col justify-between backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `linear-gradient(135deg, ${item.color}22, #0f172a)`,
            borderColor: `${item.color}88`,
          }}
        >
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ background: `${item.color}22`, color: item.color }}
            >
              {item.tag}
            </span>
            <h3 className="text-sm font-bold text-white mt-2 mb-2">{item.title}</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
          <div className="w-full h-0.5 rounded-full" style={{ background: `${item.color}44` }} />
        </div>
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
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-200">Roadmap</h2>
          <p className="text-slate-500 text-sm mt-1">With community support I would like to develop and add these features:</p>
          <p className="text-slate-600 text-xs mt-1 md:hidden">Tap a card to flip it</p>
          <p className="text-slate-600 text-xs mt-1 hidden md:block">Hover a card to flip it</p>
        </div>

        <div className="flex justify-center items-end gap-1 sm:gap-2 pb-8 pt-4 overflow-x-auto" style={{ perspective: '1200px' }}>
          {ROADMAP.map((item, i) => (
            <RoadmapCard key={item.title} item={item} index={i} total={ROADMAP.length} />
          ))}
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          Built on Solana for speed and low fees. No wallet required to play free games.
        </p>
      </div>
    </div>
  );
}
