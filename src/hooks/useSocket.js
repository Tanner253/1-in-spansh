import { useRef, useState, useCallback, useEffect } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export default function useSocket() {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const handlersRef = useRef({});

  const on = useCallback((type, handler) => {
    handlersRef.current[type] = handler;
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const connect = useCallback((username) => {
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'auth', username }));
    };

    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.type === 'auth_ok') {
        setPlayerId(msg.playerId);
        setPlayerName(msg.playerName);
      }

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      const handler = handlersRef.current[msg.type];
      if (handler) handler(msg);
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => {};
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
  }, []);

  useEffect(() => {
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  return { connected, playerId, playerName, connect, disconnect, send, on };
}
