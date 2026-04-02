import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';

const ROADMAP = [
  {
    icon: '💰',
    title: 'SOL Wagers',
    desc: 'Wager SOL or any Solana token head-to-head. Winner takes the pot.',
    accent: 'from-yellow-500/20 to-amber-600/10',
    border: 'border-yellow-500/20',
    tag: 'Up Next',
    tagColor: 'bg-yellow-400/15 text-yellow-300',
  },
  {
    icon: '🏆',
    title: 'Tournaments',
    desc: 'Bracket-style tournaments with pooled SOL prize pots. Weekly & monthly events with growing jackpots.',
    accent: 'from-purple-500/20 to-indigo-600/10',
    border: 'border-purple-500/20',
    tag: 'Coming Soon',
    tagColor: 'bg-purple-400/15 text-purple-300',
  },
  {
    icon: '🃏',
    title: 'NFT Card Skins',
    desc: 'Collect and trade custom card backs — holographic, animated, gold. Flex your deck on opponents.',
    accent: 'from-cyan-500/20 to-teal-600/10',
    border: 'border-cyan-500/20',
    tag: 'Coming Soon',
    tagColor: 'bg-cyan-400/15 text-cyan-300',
  },
  {
    icon: '👁️',
    title: 'Spectate + Predict',
    desc: 'Watch live games and predict the winner. Correct calls earn you tokens from the prediction pool.',
    accent: 'from-pink-500/20 to-rose-600/10',
    border: 'border-pink-500/20',
    tag: 'Coming Soon',
    tagColor: 'bg-pink-400/15 text-pink-300',
  },
  {
    icon: '📊',
    title: 'On-Chain Leaderboard',
    desc: 'Seasonal rankings stored on Solana. Top players earn SOL airdrops and exclusive NFT trophies.',
    accent: 'from-green-500/20 to-emerald-600/10',
    border: 'border-green-500/20',
    tag: 'Coming Soon',
    tagColor: 'bg-green-400/15 text-green-300',
  },
  {
    icon: '🔒',
    title: 'VIP Token-Gated Tables',
    desc: 'Hold specific NFTs or tokens to unlock exclusive high-stakes lobbies with premium rewards.',
    accent: 'from-orange-500/20 to-red-600/10',
    border: 'border-orange-500/20',
    tag: 'Coming Soon',
    tagColor: 'bg-orange-400/15 text-orange-300',
  },
  {
    icon: '⚡',
    title: 'Daily Challenges',
    desc: 'Complete daily tasks — "Win 3 games," "Play 5 reverses" — and earn reward tokens.',
    accent: 'from-blue-500/20 to-indigo-600/10',
    border: 'border-blue-500/20',
    tag: 'Coming Soon',
    tagColor: 'bg-blue-400/15 text-blue-300',
  },
];

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
    <div className="min-h-screen px-4 py-12 md:py-20">
      <div className="max-w-md mx-auto mb-16">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black tracking-tight mb-2">
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
            disabled={!username.trim()}
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            Play Now
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Create or join a lobby to play UNO with up to 8 players
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-200">Roadmap</h2>
          <p className="text-slate-500 text-sm mt-1">What's coming to Solana UNO</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROADMAP.map((item) => (
            <div
              key={item.title}
              className={`relative bg-gradient-to-br ${item.accent} backdrop-blur rounded-xl p-5 border ${item.border} hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{item.icon}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${item.tagColor} px-2 py-0.5 rounded-full`}>
                  {item.tag}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-1.5">{item.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          Built on Solana for speed and low fees. No wallet required to play free games.
        </p>
      </div>
    </div>
  );
}
