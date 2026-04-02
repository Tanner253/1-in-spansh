import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import useSocket from '../hooks/useSocket';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const socket = useSocket();
  const [screen, setScreen] = useState('login');
  const [lobbies, setLobbies] = useState([]);
  const [currentLobby, setCurrentLobby] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [gamePlayers, setGamePlayers] = useState([]);
  const [gameWager, setGameWager] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [error, setError] = useState(null);
  const errorTimerRef = useRef(null);
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const showError = useCallback((msg) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 3000);
  }, []);

  useEffect(() => {
    socket.on('lobby_list', (msg) => setLobbies(msg.lobbies));

    socket.on('lobby_state', (msg) => {
      setCurrentLobby(msg.lobby);
      if (msg.lobby && screenRef.current !== 'game') setScreen('lobby');
    });

    socket.on('left_lobby', () => {
      setCurrentLobby(null);
      setChatMessages([]);
      setScreen('browser');
    });

    socket.on('game_start', (msg) => {
      setGameId(msg.gameId);
      setGameState(msg.state);
      setGamePlayers(msg.players);
      setGameWager(msg.wager);
      setGameResult(null);
      setChatMessages([]);
      setScreen('game');
    });

    socket.on('game_state', (msg) => {
      setGameState(msg.state);
      setGamePlayers(msg.players);
    });

    socket.on('game_end', (msg) => {
      setGameResult({
        winnerId: msg.winnerId,
        winnerName: msg.winnerName,
        wager: msg.wager,
        playerCount: msg.playerCount,
        forfeit: msg.forfeit,
      });
    });

    socket.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev.slice(-99), msg.message]);
    });

    socket.on('reconnected', () => {
      socket.send({ type: 'get_lobbies' });
      if (screenRef.current === 'game') {
        setGameState(null);
        setGameResult(null);
        setGameId(null);
        setScreen('browser');
      }
    });

    socket.on('kicked', () => {
      setCurrentLobby(null);
      setChatMessages([]);
      setScreen('browser');
      showError('You were kicked from the lobby');
    });

    socket.on('player_forfeited', (msg) => {
      // Handled via game_state update; could show a toast later
    });

    socket.on('error', (msg) => showError(msg.message));
  }, [socket, showError]);

  const login = useCallback((username) => {
    socket.connect(username);
    setScreen('browser');
  }, [socket]);

  const createLobby = useCallback((opts) => {
    socket.send({ type: 'create_lobby', ...opts });
  }, [socket]);

  const joinLobby = useCallback((lobbyId) => {
    socket.send({ type: 'join_lobby', lobbyId });
  }, [socket]);

  const joinByCode = useCallback((code) => {
    socket.send({ type: 'join_by_code', code });
  }, [socket]);

  const kickPlayer = useCallback((targetId) => {
    socket.send({ type: 'kick_player', targetId });
  }, [socket]);

  const leaveLobby = useCallback(() => {
    socket.send({ type: 'leave_lobby' });
  }, [socket]);

  const toggleReady = useCallback(() => {
    socket.send({ type: 'toggle_ready' });
  }, [socket]);

  const startGame = useCallback(() => {
    socket.send({ type: 'start_game' });
  }, [socket]);

  const playCard = useCallback((cardUid) => {
    socket.send({ type: 'game_action', action: { action: 'play', cardUid } });
  }, [socket]);

  const drawCard = useCallback(() => {
    socket.send({ type: 'game_action', action: { action: 'draw' } });
  }, [socket]);

  const selectColor = useCallback((color) => {
    socket.send({ type: 'game_action', action: { action: 'selectColor', color } });
  }, [socket]);

  const callUno = useCallback(() => {
    socket.send({ type: 'game_action', action: { action: 'callUno' } });
  }, [socket]);

  const forfeit = useCallback(() => {
    socket.send({ type: 'forfeit' });
  }, [socket]);

  const sendChat = useCallback((text) => {
    socket.send({ type: 'chat', text });
  }, [socket]);

  const returnToLobby = useCallback(() => {
    setGameState(null);
    setGameResult(null);
    setGameId(null);
    setCurrentLobby(null);
    setChatMessages([]);
    setScreen('browser');
    socket.send({ type: 'leave_lobby' });
    socket.send({ type: 'get_lobbies' });
  }, [socket]);

  return (
    <GameContext.Provider value={{
      screen, playerId: socket.playerId, playerName: socket.playerName,
      connected: socket.connected, reconnecting: socket.reconnecting,
      lobbies, currentLobby, gameState, gamePlayers, gameWager, gameId, gameResult, chatMessages, error,
      login, createLobby, joinLobby, joinByCode, kickPlayer, leaveLobby, toggleReady, startGame,
      playCard, drawCard, selectColor, callUno, forfeit, sendChat, returnToLobby,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
