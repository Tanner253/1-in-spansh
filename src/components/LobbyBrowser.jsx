import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import RoadmapSection from './RoadmapCards';

export default function LobbyBrowser() {
  const { lobbies, playerName, createLobby, joinLobby, joinByCode, onlineCount, activeGames, fetchActiveGames, spectateGame } = useGame();
  const [showCreate, setShowCreate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPrivate, setIsPrivate] = useState(false);
  const [wagerAmount, setWagerAmount] = useState('');
  const [wagerToken, setWagerToken] = useState('SOL');
  const [lobbyCode, setLobbyCode] = useState('');

  useEffect(() => {
    fetchActiveGames();
  }, [fetchActiveGames]);

  const handleCreate = () => {
    createLobby({ maxPlayers, wager: null, isPrivate });
    setShowCreate(false);
    setWagerAmount('');
    setIsPrivate(false);
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    const code = lobbyCode.trim().toUpperCase();
    if (code.length < 4) return;
    joinByCode(code);
    setLobbyCode('');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="text-red-500">U</span>
            <span className="text-blue-500">N</span>
            <span className="text-green-500">O</span>
            <span className="text-slate-300 ml-2">Lobbies</span>
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 text-sm">Playing as <span className="text-indigo-400 font-medium">{playerName}</span></p>
            <span className="text-slate-700">·</span>
            <span className="flex items-center gap-1.5 text-sm text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {onlineCount} online
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
        >
          {showCreate ? 'Cancel' : '+ Create Lobby'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/50 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Lobby</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Max Players</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n} Players</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Wager <span className="text-yellow-400/80 text-xs ml-1">(Coming Soon)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={wagerAmount}
                  onChange={(e) => setWagerAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={wagerToken}
                  onChange={(e) => setWagerToken(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SOL">SOL</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isPrivate ? 'bg-indigo-600' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-slate-300">Private Lobby <span className="text-slate-500">(invite by code only)</span></span>
          </div>

          <button
            onClick={handleCreate}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors"
          >
            Create Lobby
          </button>
        </div>
      )}

      <form onSubmit={handleJoinByCode} className="flex gap-2 mb-6">
        <input
          type="text"
          value={lobbyCode}
          onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
          placeholder="Enter lobby code..."
          maxLength={6}
          className="flex-1 px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono tracking-widest text-center uppercase"
        />
        <button
          type="submit"
          disabled={lobbyCode.trim().length < 4}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Join by Code
        </button>
      </form>

      {activeGames.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Live Games</h2>
          </div>
          <div className="space-y-3 mb-8">
            {activeGames.map((game) => (
              <div
                key={game.id}
                className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-red-500/20 flex items-center justify-between hover:border-red-500/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-600/30 rounded-lg flex items-center justify-center text-lg">
                    <span className="animate-pulse">🔴</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {game.players.map(p => p.name).join(' vs ')}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>{game.playerCount} players</span>
                      <span className="text-red-400 font-medium">LIVE</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => spectateGame(game.id)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Watch
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Open Lobbies</h2>
      </div>
      <div className="space-y-3">
        {lobbies.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🃏</div>
            <p className="text-slate-400 text-lg">No open lobbies</p>
            <p className="text-slate-500 text-sm mt-1">Create one to get started!</p>
          </div>
        ) : (
          lobbies.map((lobby) => (
            <div
              key={lobby.id}
              className="bg-slate-800/60 backdrop-blur rounded-xl p-4 border border-slate-700/50 flex items-center justify-between hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600/30 rounded-lg flex items-center justify-center text-lg">
                  🎴
                </div>
                <div>
                  <p className="font-medium">{lobby.hostName}'s Lobby</p>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>{lobby.playerCount}/{lobby.maxPlayers} players</span>
                    {lobby.wager && (
                      <span className="text-yellow-400 font-medium">
                        {lobby.wager.amount} {lobby.wager.token}
                      </span>
                    )}
                    {!lobby.wager && <span className="text-green-400">Free</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => joinLobby(lobby.id)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Join
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-16 max-w-5xl mx-auto">
        <RoadmapSection />
      </div>
    </div>
  );
}
