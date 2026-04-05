import React, { useState } from 'react';

const ROADMAP = [
  { color: '#ff3333', title: 'SOL Wagers', tag: 'Up Next', desc: 'Wager SOL or any Solana token head-to-head. Winner takes the pot.' },
  { color: '#9945FF', title: 'Tournaments', tag: 'Coming Soon', desc: 'Bracket-style tournaments with pooled SOL prize pots. Weekly & monthly events.' },
  { color: '#14F195', title: 'NFT Card Skins', tag: 'Coming Soon', desc: 'Collect and trade custom card backs — holographic, animated, gold.' },
  { color: '#ff6b81', title: 'Spectate + Predict', tag: 'Coming Soon', desc: 'Watch live games, predict the winner, earn tokens from the pool.' },
  { color: '#1155ff', title: 'On-Chain Leaderboard', tag: 'Coming Soon', desc: 'Seasonal rankings on Solana. Top players earn SOL airdrops & NFT trophies.' },
  { color: '#ff9500', title: 'VIP Token-Gated Tables', tag: 'Coming Soon', desc: 'Hold NFTs or tokens to unlock exclusive high-stakes lobbies.' },
  { color: '#00aaff', title: 'Daily Challenges', tag: 'Coming Soon', desc: 'Complete tasks — "Win 3 games," "Play 5 reverses" — earn reward tokens.' },
];

function RoadmapCard({ item, index, total }) {
  const [flipped, setFlipped] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const fanAngle = (index - (total - 1) / 2) * 5;
  const fanY = Math.abs(index - (total - 1) / 2) * 4;

  return (
    <div
      className="relative cursor-pointer -mx-2 sm:-mx-1"
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
        className="relative w-28 sm:w-36 h-40 sm:h-52 transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg) translateY(-20px) scale(1.1)' : '',
        }}
      >
        <div
          className="absolute inset-0 rounded-xl border-2 flex flex-col items-center justify-center gap-2"
          style={{
            backfaceVisibility: 'hidden',
            background: `linear-gradient(135deg, ${item.color}33, ${item.color}11)`,
            borderColor: `${item.color}66`,
          }}
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: item.color }}
          >
            <span className="text-2xl font-black" style={{ color: item.color }}>S</span>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.tag}</span>
          <span className="text-sm font-bold text-white px-2 text-center">{item.title}</span>
        </div>

        <div
          className="absolute inset-0 rounded-xl border-2 p-4 flex flex-col justify-between"
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

export default function RoadmapSection() {
  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-200">Roadmap</h2>
        <p className="text-slate-500 text-sm mt-1">With community support I would like to develop and add these features:</p>
        <p className="text-slate-600 text-xs mt-1 md:hidden">Tap a card to flip it</p>
        <p className="text-slate-600 text-xs mt-1 hidden md:block">Hover a card to flip it</p>
      </div>

      <div className="flex justify-center items-end gap-0 sm:gap-1 pb-8 pt-4" style={{ perspective: '1200px' }}>
        {ROADMAP.map((item, i) => (
          <RoadmapCard key={item.title} item={item} index={i} total={ROADMAP.length} />
        ))}
      </div>

      <p className="text-center text-slate-600 text-xs mt-4">
        Built on Solana for speed and low fees. No wallet required to play free games.
      </p>
    </div>
  );
}
