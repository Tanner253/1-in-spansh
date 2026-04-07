import React, { useState } from 'react';

const ROADMAP = [
  { color: '#22c55e', icon: '🎮', title: 'MVP PVP Game', tag: 'Done', desc: 'Multiplayer UNO with 2–8 players, 3D table, lobbies, chat, private codes, and invite links — live and playable.' },
  { color: '#0d9488', icon: '⚖️', title: 'Game Settlement', tag: 'Done', desc: 'Match results, forfeits on disconnect, winner flow, and lobby close after games — foundation for wager payouts when SOL wagers ship.' },
  { color: '#a855f7', icon: '👁️', title: 'Spectate Mode', tag: 'Done', desc: 'Watch any live game in real time from the lobby browser. Full 3D spectator view with turn indicators and player highlights.' },
  { color: '#ff3333', icon: '💰', title: 'SOL Wagers', tag: 'Up Next', desc: 'Wager SOL or any Solana token head-to-head. Winner takes the pot.' },
  { color: '#9945FF', icon: '🏆', title: 'Tournaments', tag: 'Coming Soon', desc: 'Bracket-style tournaments with pooled SOL prize pots. Weekly & monthly events.' },
  { color: '#14F195', icon: '🎁', title: 'Custom Skins & Lootboxes', tag: 'Coming Soon', desc: 'Cosmetic card backs and table flair — unlock via gameplay, events, and lootbox-style drops (no NFT required).' },
  { color: '#ff6b81', icon: '🔮', title: 'Predict & Earn', tag: 'Coming Soon', desc: 'Predict the winner of live games and earn tokens from the prediction pool.' },
  { color: '#1155ff', icon: '📊', title: 'On-Chain Leaderboard', tag: 'Coming Soon', desc: 'Seasonal rankings on Solana. Top players earn SOL airdrops & NFT trophies.' },
  { color: '#ff9500', icon: '👑', title: 'VIP Token-Gated Tables', tag: 'Coming Soon', desc: 'Hold NFTs or tokens to unlock exclusive high-stakes lobbies.' },
  { color: '#00aaff', icon: '⚡', title: 'Daily Challenges', tag: 'Coming Soon', desc: 'Complete tasks — "Win 3 games," "Play 5 reverses" — earn reward tokens.' },
];

const PATCH_NOTES = [
  {
    version: '0.4.0',
    date: 'Apr 6, 2026',
    title: 'Global Chat, Video Background & Stability',
    changes: [
      'Global chat in the lobby browser — talk to everyone online pre and post game',
      'Looping demo video background across login, lobby browser, and lobby room screens',
      'Player sidebar redesign — compact leaderboard-style list replaces overlapping info cards',
      'Server crash protection — global error handlers, timer loop isolation, and disconnect race-condition fixes',
      'Eliminated-player guards in game engine to prevent state corruption on timeout',
    ],
  },
  {
    version: '0.3.0',
    date: 'Apr 6, 2026',
    title: 'Spectate, Direction & Player Count',
    changes: [
      'Live spectate mode — watch any in-progress game from the lobby browser',
      'Turn direction indicator (clockwise/counter-clockwise arrow) in game HUD',
      'Next player highlighted with amber glow + "NEXT" label',
      'Current player highlighted with green glow on info cards',
      'Online player count shown in lobby browser',
      'Live games listed alongside open lobbies',
    ],
  },
  {
    version: '0.2.0',
    date: 'Apr 5, 2026',
    title: 'Lobby & Connection Improvements',
    changes: [
      'Disconnected player no longer closes the lobby for everyone',
      'Lobby closed notification when server force-closes a lobby',
      'Instant login — auth transitions on server acknowledgment, no timeout',
      'Client reconnect detection returns you to lobby browser',
    ],
  },
  {
    version: '0.1.0',
    date: 'Apr 2026',
    title: 'MVP Launch',
    changes: [
      'Multiplayer UNO: 2–8 players, real-time WebSocket gameplay',
      '3D table with Three.js card rendering',
      'Public & private lobbies with invite codes and share links',
      'In-game chat, forfeit, kick, ready-up, and host controls',
      'Mobile-optimized UI with swipeable card hand',
    ],
  },
];

function RoadmapCard({ item, index, total }) {
  const [flipped, setFlipped] = useState(false);

  const fanAngle = (index - (total - 1) / 2) * 5;
  const fanY = Math.abs(index - (total - 1) / 2) * 4;

  return (
    <div
      className="relative cursor-pointer -mx-1"
      style={{
        transform: `rotate(${fanAngle}deg) translateY(${fanY}px)`,
        transformOrigin: 'bottom center',
        zIndex: flipped ? 50 : total - Math.abs(index - Math.floor(total / 2)),
        transition: 'transform 0.3s ease, z-index 0s',
      }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        className="relative w-36 h-52 transition-transform duration-500"
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
          <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
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

function MobileRoadmapCard({ item }) {
  return (
    <div
      className="rounded-2xl border-2 p-5 flex flex-col gap-3 w-full"
      style={{
        background: `linear-gradient(135deg, ${item.color}18, #0f172a)`,
        borderColor: `${item.color}55`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${item.color}22` }}
        >
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white leading-tight">{item.title}</h3>
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: item.color }}
          >
            {item.tag}
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
      <div className="w-full h-0.5 rounded-full" style={{ background: `${item.color}33` }} />
    </div>
  );
}

function MobileRoadmap() {
  const [idx, setIdx] = useState(0);
  const item = ROADMAP[idx];

  return (
    <div>
      <MobileRoadmapCard item={item} />
      <div className="flex items-center justify-between mt-3 px-1">
        <button
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-white text-lg flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
        >
          ◀
        </button>
        <div className="flex gap-1.5">
          {ROADMAP.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: i === idx ? ROADMAP[idx].color : 'rgba(255,255,255,0.15)',
                transform: i === idx ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setIdx(Math.min(ROADMAP.length - 1, idx + 1))}
          disabled={idx === ROADMAP.length - 1}
          className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-white text-lg flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

export function PatchNotes() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-slate-200 text-center mb-1">Patch Notes</h2>
      <p className="text-slate-500 text-xs md:text-sm text-center mb-6">Latest updates and improvements</p>
      <div className="relative pl-6 border-l-2 border-slate-700/60 space-y-8">
        {PATCH_NOTES.map((patch) => (
          <div key={patch.version} className="relative">
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500" />
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                v{patch.version}
              </span>
              <span className="text-xs text-slate-500">{patch.date}</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2">{patch.title}</h3>
            <ul className="space-y-1">
              {patch.changes.map((change, i) => (
                <li key={i} className="text-xs text-slate-400 leading-relaxed flex gap-2">
                  <span className="text-indigo-500 mt-0.5 shrink-0">+</span>
                  {change}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoadmapSection() {
  return (
    <div>
      <div className="text-center mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-200">Roadmap</h2>
        <p className="text-slate-500 text-xs md:text-sm mt-1">With community support I would like to develop and add these features:</p>
      </div>

      {/* Desktop: fan of cards */}
      <div className="hidden md:flex justify-center items-end gap-0 sm:gap-1 pb-8 pt-4" style={{ perspective: '1200px' }}>
        {ROADMAP.map((item, i) => (
          <RoadmapCard key={item.title} item={item} index={i} total={ROADMAP.length} />
        ))}
      </div>
      <p className="text-center text-slate-600 text-xs mt-2 hidden md:block">Hover a card to flip it</p>

      {/* Mobile: single card with arrow nav */}
      <div className="md:hidden px-2">
        <MobileRoadmap />
      </div>

      <p className="text-center text-slate-600 text-xs mt-4">
        Built on Solana for speed and low fees. No wallet required to play free games.
      </p>
    </div>
  );
}
