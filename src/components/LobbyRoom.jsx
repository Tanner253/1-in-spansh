import React from 'react';
import { useGame } from '../contexts/GameContext';
import Chat from './Chat';

export default function LobbyRoom() {
  const { currentLobby, playerId, toggleReady, startGame, leaveLobby } = useGame();

  if (!currentLobby) return null;

  const isHost = playerId === currentLobby.hostId;
  const allReady = currentLobby.players.every(p => p.id === currentLobby.hostId || p.ready);
  const canStart = isHost && allReady && currentLobby.players.length >= 2;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Game Lobby</h2>
          <p className="text-slate-500 text-sm">
            Code: <span className="text-indigo-400 font-mono">{currentLobby.id}</span>
            {currentLobby.wager && (
              <span className="text-yellow-400 ml-3">
                Wager: {currentLobby.wager.amount} {currentLobby.wager.token}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={leaveLobby}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
        >
          Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
            Players ({currentLobby.players.length}/{currentLobby.maxPlayers})
          </h3>
          <div className="space-y-2">
            {currentLobby.players.map((p) => (
              <div
                key={p.id}
                className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/40 flex items-center justify-center text-sm font-bold">
                    {p.name[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium">{p.name}</span>
                    {p.id === currentLobby.hostId && (
                      <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">HOST</span>
                    )}
                  </div>
                </div>
                {p.id === currentLobby.hostId ? (
                  <span className="text-xs text-slate-500">—</span>
                ) : p.ready ? (
                  <span className="text-green-400 text-sm font-medium">Ready</span>
                ) : (
                  <span className="text-slate-500 text-sm">Not Ready</span>
                )}
              </div>
            ))}

            {Array.from({ length: currentLobby.maxPlayers - currentLobby.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-800/30 rounded-xl p-4 border border-dashed border-slate-700/50 text-center text-slate-600 text-sm">
                Waiting for player...
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            {!isHost && (
              <button
                onClick={toggleReady}
                className={`flex-1 py-3 font-semibold rounded-xl transition-colors ${
                  currentLobby.players.find(p => p.id === playerId)?.ready
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {currentLobby.players.find(p => p.id === playerId)?.ready ? 'Unready' : 'Ready Up'}
              </button>
            )}
            {isHost && (
              <button
                onClick={startGame}
                disabled={!canStart}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors"
              >
                {!canStart && currentLobby.players.length < 2
                  ? 'Need more players'
                  : !canStart
                    ? 'Waiting for players to ready up'
                    : 'Start Game'}
              </button>
            )}
          </div>
        </div>

        <Chat />
      </div>
    </div>
  );
}
