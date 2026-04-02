/**
 * LobbyManager - Manages UNO game lobbies
 * Handles creation, joining, ready-up, and game start
 */

import { v4 as uuid } from 'uuid';
import UnoEngine from './UnoEngine.js';

export default class LobbyManager {
  constructor(broadcast) {
    this.lobbies = new Map();
    this.games = new Map();
    this.broadcast = broadcast;
    this._startTimerLoop();
  }

  createLobby(hostId, hostName, { maxPlayers = 4, wager = null } = {}) {
    const id = uuid().slice(0, 8);
    const lobby = {
      id,
      hostId,
      maxPlayers: Math.min(4, Math.max(2, maxPlayers)),
      wager,
      players: [{ id: hostId, name: hostName, ready: false }],
      status: 'waiting',
      createdAt: Date.now(),
      chat: [],
    };
    this.lobbies.set(id, lobby);
    return lobby;
  }

  joinLobby(lobbyId, playerId, playerName) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'LOBBY_NOT_FOUND' };
    if (lobby.status !== 'waiting') return { error: 'LOBBY_IN_GAME' };
    if (lobby.players.length >= lobby.maxPlayers) return { error: 'LOBBY_FULL' };
    if (lobby.players.find(p => p.id === playerId)) return { error: 'ALREADY_IN_LOBBY' };

    lobby.players.push({ id: playerId, name: playerName, ready: false });
    return { success: true, lobby };
  }

  leaveLobby(lobbyId, playerId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'LOBBY_NOT_FOUND' };

    lobby.players = lobby.players.filter(p => p.id !== playerId);

    if (lobby.players.length === 0) {
      this.lobbies.delete(lobbyId);
      return { success: true, dissolved: true };
    }

    if (playerId === lobby.hostId) {
      lobby.hostId = lobby.players[0].id;
    }

    return { success: true, lobby };
  }

  toggleReady(lobbyId, playerId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'LOBBY_NOT_FOUND' };

    const player = lobby.players.find(p => p.id === playerId);
    if (!player) return { error: 'NOT_IN_LOBBY' };

    player.ready = !player.ready;
    return { success: true, lobby };
  }

  startGame(lobbyId, requesterId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'LOBBY_NOT_FOUND' };
    if (requesterId !== lobby.hostId) return { error: 'NOT_HOST' };
    if (lobby.players.length < 2) return { error: 'NEED_MORE_PLAYERS' };

    const allReady = lobby.players.every(p => p.id === lobby.hostId || p.ready);
    if (!allReady) return { error: 'PLAYERS_NOT_READY' };

    const playerIds = lobby.players.map(p => p.id);
    const engine = new UnoEngine(playerIds);

    const game = {
      id: lobbyId,
      engine,
      players: lobby.players.map(p => ({ ...p })),
      wager: lobby.wager,
      chat: [],
      startedAt: Date.now(),
    };

    this.games.set(lobbyId, game);
    lobby.status = 'in_game';

    return { success: true, game };
  }

  addChatMessage(lobbyId, playerId, playerName, text) {
    const lobby = this.lobbies.get(lobbyId);
    const game = this.games.get(lobbyId);
    const target = game || lobby;
    if (!target) return { error: 'NOT_FOUND' };

    const msg = {
      id: uuid().slice(0, 8),
      playerId,
      playerName,
      text: text.slice(0, 200),
      timestamp: Date.now(),
    };
    target.chat.push(msg);
    if (target.chat.length > 100) target.chat.shift();
    return { success: true, message: msg };
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  getLobby(lobbyId) {
    return this.lobbies.get(lobbyId);
  }

  listLobbies() {
    return Array.from(this.lobbies.values())
      .filter(l => l.status === 'waiting')
      .map(l => ({
        id: l.id,
        hostName: l.players[0]?.name || 'Unknown',
        playerCount: l.players.length,
        maxPlayers: l.maxPlayers,
        wager: l.wager,
        createdAt: l.createdAt,
      }));
  }

  endGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    this.games.delete(gameId);
    this.lobbies.delete(gameId);
    return game;
  }

  findPlayerLobby(playerId) {
    for (const lobby of this.lobbies.values()) {
      if (lobby.players.find(p => p.id === playerId)) return lobby;
    }
    return null;
  }

  findPlayerGame(playerId) {
    for (const game of this.games.values()) {
      if (game.players.find(p => p.id === playerId)) return game;
    }
    return null;
  }

  _startTimerLoop() {
    setInterval(() => {
      for (const [gameId, game] of this.games) {
        const engine = game.engine;
        if (engine.status !== 'playing') continue;

        const elapsed = Date.now() - engine.turnStartedAt;
        if (elapsed >= engine.turnTimeLimitMs) {
          engine.handleTimeout();
          this.broadcast(gameId, game);
        }
      }
    }, 1000);
  }
}
