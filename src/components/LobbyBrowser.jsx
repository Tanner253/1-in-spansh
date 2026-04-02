import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';

export default function LobbyBrowser() {
  const { lobbies, playerName, createLobby, joinLobby } = useGame();
  const [showCreate, setShowCreate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [wagerAmount, setWagerAmount] = useState('');
  const [wagerToken, setWagerToken] = useState('SOL');

  const handleCreate = () => {
    const wager = wagerAmount && parseFloat(wagerAmount) > 0
      ? { amount: parseFloat(wagerAmount), token: wagerToken }
      : null;
    createLobby({ maxPlayers, wager });
    setShowCreate(false);
    setWagerAmount('');
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
          <p className="text-slate-500 text-sm mt-1">Playing as <span className="text-indigo-400 font-medium">{playerName}</span></p>
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
                <option value={2}>2 Players</option>
                <option value={3}>3 Players</option>
                <option value={4}>4 Players</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Wager (optional)</label>
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

          <button
            onClick={handleCreate}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors"
          >
            Create Lobby
          </button>
        </div>
      )}

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
    </div>
  );
}
