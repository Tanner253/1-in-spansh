import { useRef, useState, useCallback, useEffect } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 10000;

export default function useSocket() {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const handlersRef = useRef({});
  const usernameRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const intentionalCloseRef = useRef(false);

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

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const createConnection = useCallback((username, isReconnect = false) => {
    clearReconnectTimer();
    if (wsRef.current && wsRef.current.readyState < 2) {
      wsRef.current.close();
    }

    if (isReconnect) setReconnecting(true);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setReconnecting(false);
      reconnectAttemptRef.current = 0;
      ws.send(JSON.stringify({ type: 'auth', username }));
    };

    ws.onmessage = (e) => {
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
      setConnected(false);

      if (!intentionalCloseRef.current && usernameRef.current) {
        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, attempt), RECONNECT_MAX_MS);
        reconnectAttemptRef.current = attempt + 1;
        setReconnecting(true);

        reconnectTimerRef.current = setTimeout(() => {
          createConnection(usernameRef.current, true);
        }, delay);
      } else {
        setPlayerId(null);
        setReconnecting(false);
      }
    };

    ws.onerror = () => {};
  }, [clearReconnectTimer]);

  const connect = useCallback((username) => {
    intentionalCloseRef.current = false;
    usernameRef.current = username;
    reconnectAttemptRef.current = 0;
    createConnection(username, false);
  }, [createConnection]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    clearReconnectTimer();
    usernameRef.current = null;
    if (wsRef.current) wsRef.current.close();
  }, [clearReconnectTimer]);

  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true;
      clearReconnectTimer();
      if (wsRef.current) wsRef.current.close();
    };
  }, [clearReconnectTimer]);

  return { connected, reconnecting, playerId, playerName, connect, disconnect, send, on };
}
