import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuid } from 'uuid';
import 'dotenv/config';
import LobbyManager from './services/LobbyManager.js';

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception — keeping process alive:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection — keeping process alive:', reason);
});

const PORT = process.env.PORT || 3001;
const clients = new Map();
const spectators = new Map();

function send(ws, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data));
}

function broadcastGameState(gameId, game) {
  const playerList = game.players.map(pl => ({ id: pl.id, name: pl.name }));
  game.players.forEach(p => {
    const ws = clients.get(p.id);
    if (ws) {
      send(ws, {
        type: 'game_state',
        gameId,
        state: game.engine.getStateForPlayer(p.id),
        players: playerList,
        wager: game.wager,
      });
    }
  });
  const specs = spectators.get(gameId);
  if (specs?.size) {
    const specState = game.engine.getStateForSpectator();
    for (const specId of specs) {
      const ws = clients.get(specId);
      if (ws) {
        send(ws, {
          type: 'game_state',
          gameId,
          state: specState,
          players: playerList,
          wager: game.wager,
          spectating: true,
        });
      }
    }
  }
}

function broadcastLobbyState(lobby) {
  if (!lobby) return;
  lobby.players.forEach(p => {
    const ws = clients.get(p.id);
    if (ws) {
      send(ws, { type: 'lobby_state', lobby: sanitizeLobby(lobby) });
    }
  });
}

function broadcastLobbyList() {
  const list = lobbyManager.listLobbies();
  for (const [, ws] of clients) {
    send(ws, { type: 'lobby_list', lobbies: list });
  }
}

function broadcastOnlineCount() {
  const count = clients.size;
  for (const [, ws] of clients) {
    send(ws, { type: 'online_count', count });
  }
}

function sanitizeLobby(lobby) {
  return {
    id: lobby.id,
    hostId: lobby.hostId,
    code: lobby.code,
    isPrivate: lobby.isPrivate,
    maxPlayers: lobby.maxPlayers,
    wager: lobby.wager,
    players: lobby.players,
    status: lobby.status,
    chat: lobby.chat.slice(-50),
  };
}

const lobbyManager = new LobbyManager(broadcastGameState);

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('UNO PVP Server');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let playerId = null;
  let playerName = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    try {
    switch (msg.type) {
      case 'auth': {
        playerId = uuid().slice(0, 12);
        playerName = (msg.username || 'Player').slice(0, 20);
        clients.set(playerId, ws);
        ws.playerId = playerId;
        ws.playerName = playerName;
        send(ws, { type: 'auth_ok', playerId, playerName });
        send(ws, { type: 'lobby_list', lobbies: lobbyManager.listLobbies() });
        broadcastOnlineCount();
        break;
      }

      case 'create_lobby': {
        if (!playerId) return;
        const existing = lobbyManager.findPlayerLobby(playerId);
        if (existing) {
          lobbyManager.leaveLobby(existing.id, playerId);
          broadcastLobbyState(lobbyManager.getLobby(existing.id));
        }
        const lobby = lobbyManager.createLobby(playerId, playerName, {
          maxPlayers: msg.maxPlayers,
          wager: msg.wager || null,
          isPrivate: !!msg.isPrivate,
        });
        broadcastLobbyState(lobby);
        broadcastLobbyList();
        break;
      }

      case 'join_lobby': {
        if (!playerId) return;
        const existing = lobbyManager.findPlayerLobby(playerId);
        if (existing) {
          lobbyManager.leaveLobby(existing.id, playerId);
          broadcastLobbyState(lobbyManager.getLobby(existing.id));
        }
        const result = lobbyManager.joinLobby(msg.lobbyId, playerId, playerName);
        if (result.error) {
          send(ws, { type: 'error', message: result.error });
        } else {
          broadcastLobbyState(result.lobby);
          broadcastLobbyList();
        }
        break;
      }

      case 'join_by_code': {
        if (!playerId) return;
        const existing = lobbyManager.findPlayerLobby(playerId);
        if (existing) {
          lobbyManager.leaveLobby(existing.id, playerId);
          broadcastLobbyState(lobbyManager.getLobby(existing.id));
        }
        const codeResult = lobbyManager.joinByCode(msg.code, playerId, playerName);
        if (codeResult.error) {
          send(ws, { type: 'error', message: codeResult.error });
        } else {
          broadcastLobbyState(codeResult.lobby);
          broadcastLobbyList();
        }
        break;
      }

      case 'kick_player': {
        if (!playerId) return;
        const lobby = lobbyManager.findPlayerLobby(playerId);
        if (!lobby) return;
        const kickResult = lobbyManager.kickPlayer(lobby.id, playerId, msg.targetId);
        if (kickResult.error) {
          send(ws, { type: 'error', message: kickResult.error });
        } else {
          const kickedWs = clients.get(msg.targetId);
          if (kickedWs) {
            send(kickedWs, { type: 'kicked', lobbyId: lobby.id });
          }
          broadcastLobbyState(kickResult.lobby);
          broadcastLobbyList();
        }
        break;
      }

      case 'leave_lobby': {
        if (!playerId) return;
        const lobby = lobbyManager.findPlayerLobby(playerId);
        if (!lobby) return;
        const result = lobbyManager.leaveLobby(lobby.id, playerId);
        if (!result.dissolved) broadcastLobbyState(result.lobby);
        send(ws, { type: 'left_lobby' });
        broadcastLobbyList();
        break;
      }

      case 'toggle_ready': {
        if (!playerId) return;
        const lobby = lobbyManager.findPlayerLobby(playerId);
        if (!lobby) return;
        lobbyManager.toggleReady(lobby.id, playerId);
        broadcastLobbyState(lobby);
        break;
      }

      case 'start_game': {
        if (!playerId) return;
        const lobby = lobbyManager.findPlayerLobby(playerId);
        if (!lobby) return;
        const result = lobbyManager.startGame(lobby.id, playerId);
        if (result.error) {
          send(ws, { type: 'error', message: result.error });
        } else {
          const game = result.game;
          game.players.forEach(p => {
            const pws = clients.get(p.id);
            if (pws) {
              send(pws, {
                type: 'game_start',
                gameId: game.id,
                state: game.engine.getStateForPlayer(p.id),
                players: game.players.map(pl => ({ id: pl.id, name: pl.name })),
                wager: game.wager,
              });
            }
          });
          broadcastLobbyList();
        }
        break;
      }

      case 'game_action': {
        if (!playerId) return;
        const game = lobbyManager.findPlayerGame(playerId);
        if (!game) return;
        const result = game.engine.play(playerId, msg.action);
        if (result.error) {
          send(ws, { type: 'error', message: result.error });
        } else {
          broadcastGameState(game.id, game);
          if (result.gameComplete) {
            handleGameEnd(game);
          }
        }
        break;
      }

      case 'chat': {
        if (!playerId) return;
        const lobby = lobbyManager.findPlayerLobby(playerId);
        const game = lobbyManager.findPlayerGame(playerId);
        const targetId = game?.id || lobby?.id;
        if (!targetId) return;

        const chatResult = lobbyManager.addChatMessage(targetId, playerId, playerName, msg.text);
        if (chatResult.success) {
          const targets = game?.players || lobby?.players || [];
          targets.forEach(p => {
            const pws = clients.get(p.id);
            if (pws) send(pws, { type: 'chat_message', message: chatResult.message });
          });
        }
        break;
      }

      case 'get_lobbies': {
        send(ws, { type: 'lobby_list', lobbies: lobbyManager.listLobbies() });
        break;
      }

      case 'get_active_games': {
        if (!playerId) return;
        const games = lobbyManager.listActiveGames();
        send(ws, { type: 'active_games', games });
        break;
      }

      case 'spectate_game': {
        if (!playerId) return;
        const gameId = msg.gameId;
        const game = lobbyManager.getGame(gameId);
        if (!game || game.engine.status !== 'playing') {
          send(ws, { type: 'error', message: 'Game not found or already ended.' });
          break;
        }
        if (!spectators.has(gameId)) spectators.set(gameId, new Set());
        spectators.get(gameId).add(playerId);
        const specState = game.engine.getStateForSpectator();
        send(ws, {
          type: 'game_start',
          gameId,
          state: specState,
          players: game.players.map(p => ({ id: p.id, name: p.name })),
          wager: game.wager,
          spectating: true,
        });
        break;
      }

      case 'stop_spectate': {
        if (!playerId) return;
        for (const [gId, specs] of spectators) {
          specs.delete(playerId);
          if (specs.size === 0) spectators.delete(gId);
        }
        send(ws, { type: 'stopped_spectate' });
        break;
      }

      case 'forfeit': {
        if (!playerId) return;
        handleForfeit(playerId, playerName);
        break;
      }

      case 'pong': break;
    }
    } catch (err) {
      console.error(`[ERROR] Message handler (player=${playerId}, type=${msg?.type}):`, err);
    }
  });

  ws.on('close', () => {
    try {
      if (playerId) {
        handleForfeit(playerId, playerName);

        for (const [gId, specs] of spectators) {
          specs.delete(playerId);
          if (specs.size === 0) spectators.delete(gId);
        }

        const lobby = lobbyManager.findPlayerLobby(playerId);
        if (lobby && lobby.status === 'waiting') {
          const result = lobbyManager.leaveLobby(lobby.id, playerId);
          if (!result.dissolved && result.lobby) {
            broadcastLobbyState(result.lobby);
          }
          broadcastLobbyList();
        }
        clients.delete(playerId);
        broadcastOnlineCount();
      }
    } catch (err) {
      console.error(`[ERROR] Close handler (player=${playerId}):`, err);
    }
  });
});

function handleForfeit(forfeitPlayerId, forfeitPlayerName) {
  const game = lobbyManager.findPlayerGame(forfeitPlayerId);
  if (!game || game.engine.status !== 'playing') return;

  const result = game.engine.removePlayer(forfeitPlayerId);

  // Notify everyone that this player forfeited
  game.players.forEach(p => {
    const pws = clients.get(p.id);
    if (pws) {
      send(pws, {
        type: 'player_forfeited',
        gameId: game.id,
        playerId: forfeitPlayerId,
        playerName: forfeitPlayerName,
      });
    }
  });

  if (result.gameComplete) {
    game.forfeitedBy = { id: forfeitPlayerId, name: forfeitPlayerName };
    broadcastGameState(game.id, game);
    handleGameEnd(game);
  } else {
    broadcastGameState(game.id, game);
  }
}

function handleGameEnd(game) {
  const winner = game.players.find(p => p.id === game.engine.winnerId);
  const playerCount = game.players.length;

  const endMsg = {
    type: 'game_end',
    gameId: game.id,
    winnerId: game.engine.winnerId,
    winnerName: winner?.name || 'Unknown',
    wager: game.wager,
    playerCount,
    forfeit: game.forfeitedBy || null,
  };

  game.players.forEach(p => {
    const pws = clients.get(p.id);
    if (pws) send(pws, endMsg);
  });

  const specs = spectators.get(game.id);
  if (specs?.size) {
    for (const specId of specs) {
      const ws = clients.get(specId);
      if (ws) send(ws, { ...endMsg, spectating: true });
    }
  }

  setTimeout(() => {
    lobbyManager.endGame(game.id);
    spectators.delete(game.id);
    broadcastLobbyList();
  }, 5000);
}

setInterval(() => {
  for (const [, ws] of clients) {
    send(ws, { type: 'ping' });
  }
}, 15000);

server.listen(PORT, () => {
  console.log(`UNO PVP server running on port ${PORT}`);
});
