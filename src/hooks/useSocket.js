import { useRef, useState, useCallback, useEffect } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const RECONNECT_DELAY_MS = 2000;
const CONNECT_TIMEOUT_MS = 8000;

export default function useSocket() {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const handlersRef = useRef({});
  const usernameRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const intentionalCloseRef = useRef(false);
  const connectionIdRef = useRef(0);

  const on = useCallback((type, handler) => {
    handlersRef.current[type] = handler;
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  const killOldSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      if (wsRef.current.readyState < 2) wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const createConnection = useCallback((username, isReconnect = false) => {
    clearTimers();
    killOldSocket();

    if (isReconnect) setReconnecting(true);

    const myId = ++connectionIdRef.current;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    connectTimeoutRef.current = setTimeout(() => {
      if (connectionIdRef.current !== myId) return;
      if (ws.readyState !== 1) {
        ws.onopen = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
        scheduleReconnect(username);
      }
    }, CONNECT_TIMEOUT_MS);

    ws.onopen = () => {
      if (connectionIdRef.current !== myId) return;
      clearTimeout(connectTimeoutRef.current);
      setConnected(true);
      setReconnecting(false);
      ws.send(JSON.stringify({ type: 'auth', username }));
    };

    ws.onmessage = (e) => {
      if (connectionIdRef.current !== myId) return;
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.type === 'auth_ok') {
        setPlayerId(msg.playerId);
        setPlayerName(msg.playerName);
        if (isReconnect) {
          const handler = handlersRef.current['reconnected'];
          if (handler) handler(msg);
        }
      }

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      const handler = handlersRef.current[msg.type];
      if (handler) handler(msg);
    };

    ws.onclose = () => {
      if (connectionIdRef.current !== myId) return;
      setConnected(false);

      if (!intentionalCloseRef.current && usernameRef.current) {
        scheduleReconnect(username);
      } else {
        setPlayerId(null);
        setReconnecting(false);
      }
    };

    ws.onerror = () => {};

    function scheduleReconnect(uname) {
      setReconnecting(true);
      reconnectTimerRef.current = setTimeout(() => {
        if (intentionalCloseRef.current) return;
        createConnection(uname, true);
      }, RECONNECT_DELAY_MS);
    }
  }, [clearTimers, killOldSocket]);

  const connect = useCallback((username) => {
    intentionalCloseRef.current = false;
    usernameRef.current = username;
    createConnection(username, false);
  }, [createConnection]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    clearTimers();
    killOldSocket();
    usernameRef.current = null;
    setConnected(false);
    setReconnecting(false);
    setPlayerId(null);
  }, [clearTimers, killOldSocket]);

  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true;
      clearTimers();
      killOldSocket();
    };
  }, [clearTimers, killOldSocket]);

  return { connected, reconnecting, playerId, playerName, connect, disconnect, send, on };
}
