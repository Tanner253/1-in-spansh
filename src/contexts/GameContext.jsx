import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import useSocket from '../hooks/useSocket';
import { getLobbyCodeFromSearch, stripLobbyParamsFromUrl, syncLobbyToUrl } from '../utils/share';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const socket = useSocket();
  const urlJoinPendingRef = useRef(null);
  const urlJoinConsumedRef = useRef(false);
  const activeLobbyCodeRef = useRef(null);
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
  const prevConnectedRef = useRef(null);

  const showError = useCallback((msg) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 3000);
  }, []);

  useEffect(() => {
    const code = getLobbyCodeFromSearch(window.location.search);
    if (code) urlJoinPendingRef.current = code;
  }, []);

  useEffect(() => {
    socket.on('auth_ok', () => {
      if (screenRef.current === 'login') setScreen('browser');
    });

    socket.on('lobby_list', (msg) => {
      setLobbies(msg.lobbies);
      if (screenRef.current === 'login') setScreen('browser');
      if (urlJoinPendingRef.current && !urlJoinConsumedRef.current) {
        urlJoinConsumedRef.current = true;
        const code = urlJoinPendingRef.current;
        urlJoinPendingRef.current = null;
        socket.send({ type: 'join_by_code', code });
      }
    });

    socket.on('lobby_state', (msg) => {
      setCurrentLobby(msg.lobby);
      if (msg.lobby?.code) activeLobbyCodeRef.current = msg.lobby.code;
      if (msg.lobby && screenRef.current !== 'game') setScreen('lobby');
    });

    socket.on('left_lobby', () => {
      setCurrentLobby(null);
      activeLobbyCodeRef.current = null;
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

    socket.on('kicked', () => {
      setCurrentLobby(null);
      activeLobbyCodeRef.current = null;
      setChatMessages([]);
      setScreen('browser');
      showError('You were kicked from the lobby');
    });

    socket.on('lobby_closed', (msg) => {
      setCurrentLobby(null);
      activeLobbyCodeRef.current = null;
      setChatMessages([]);
      setScreen('browser');
      showError(msg.message || 'Lobby closed');
    });

    socket.on('error', (msg) => showError(msg.message));
  }, [socket, showError]);

  useEffect(() => {
    const c = socket.connected;
    if (prevConnectedRef.current === null) {
      prevConnectedRef.current = c;
      return;
    }
    if (prevConnectedRef.current === true && c === false) {
      if (screenRef.current === 'game' || screenRef.current === 'lobby') {
        setCurrentLobby(null);
        activeLobbyCodeRef.current = null;
        setGameState(null);
        setGameId(null);
        setGameResult(null);
        setChatMessages([]);
        setScreen('browser');
        showError('Disconnected from server');
      }
    }
    prevConnectedRef.current = c;
  }, [socket.connected, showError]);

  useEffect(() => {
    const code = currentLobby?.code || activeLobbyCodeRef.current;
    if ((screen === 'lobby' || screen === 'game') && code) {
      syncLobbyToUrl(code);
    }
  }, [screen, currentLobby?.code]);

  useEffect(() => {
    if (screen === 'lobby' || screen === 'game' || screen === 'login') return;
    stripLobbyParamsFromUrl();
  }, [screen]);

  const login = useCallback((username) => {
    socket.connect(username);
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
    activeLobbyCodeRef.current = null;
    setChatMessages([]);
    setScreen('browser');
    socket.send({ type: 'leave_lobby' });
    socket.send({ type: 'get_lobbies' });
  }, [socket]);

  return (
    <GameContext.Provider value={{
      screen, playerId: socket.playerId, playerName: socket.playerName, connected: socket.connected,
      lobbies, currentLobby, gameState, gamePlayers, gameWager, gameId, gameResult, chatMessages, error,
      showError,
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
