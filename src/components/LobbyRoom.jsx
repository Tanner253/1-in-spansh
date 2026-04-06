import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import Chat from './Chat';
import { getLobbyJoinUrl, buildLobbyShareTweet, openTwitterIntent } from '../utils/share';
import VideoBackground from './VideoBackground';

export default function LobbyRoom() {
  const { currentLobby, playerId, toggleReady, startGame, leaveLobby, kickPlayer } = useGame();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!currentLobby) return null;

  const isHost = playerId === currentLobby.hostId;
  const allReady = currentLobby.players.every(p => p.id === currentLobby.hostId || p.ready);
  const canStart = isHost && allReady && currentLobby.players.length >= 2;

  const inviteUrl = getLobbyJoinUrl(currentLobby.code);

  const copyCode = () => {
    navigator.clipboard.writeText(currentLobby.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyInviteLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  };

  const shareOnX = () => {
    if (!inviteUrl) return;
    const { text, url } = buildLobbyShareTweet(currentLobby, inviteUrl);
    openTwitterIntent({ text, url });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto relative">
      <VideoBackground />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-slate-200">Game Lobby</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm mt-1">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-mono tracking-widest transition-colors"
              title="Copy lobby code"
            >
              {currentLobby.code}
              <span className="text-xs">{copied ? '✓' : '📋'}</span>
            </button>
            {currentLobby.isPrivate && (
              <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Private</span>
            )}
            {currentLobby.wager && (
              <span className="text-yellow-400">
                Wager: {currentLobby.wager.amount} {currentLobby.wager.token}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              type="button"
              onClick={copyInviteLink}
              disabled={!inviteUrl}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition-colors disabled:opacity-50"
            >
              {linkCopied ? '✓ Link copied' : 'Copy invite link'}
            </button>
            <button
              type="button"
              onClick={shareOnX}
              disabled={!inviteUrl}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #ff3333, #ff6b81)', boxShadow: '0 2px 12px rgba(255,51,51,0.3)' }}
            >
              𝕏 Share lobby
            </button>
          </div>
        </div>
        <button
          onClick={leaveLobby}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors shrink-0"
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
                <div className="flex items-center gap-2">
                  {p.id === currentLobby.hostId ? (
                    <span className="text-xs text-slate-500">—</span>
                  ) : p.ready ? (
                    <span className="text-green-400 text-sm font-medium">Ready</span>
                  ) : (
                    <span className="text-slate-500 text-sm">Not Ready</span>
                  )}
                  {isHost && p.id !== currentLobby.hostId && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="ml-2 px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-md transition-colors"
                      title={`Kick ${p.name}`}
                    >
                      Kick
                    </button>
                  )}
                </div>
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
