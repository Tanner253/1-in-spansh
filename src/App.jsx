import React from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import LoginScreen from './components/LoginScreen';
import LobbyBrowser from './components/LobbyBrowser';
import LobbyRoom from './components/LobbyRoom';
import GameScreen from './components/GameScreen';

function ConnectionBanner() {
  const { reconnecting, screen } = useGame();

  if (screen === 'login' || !reconnecting) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600/95 text-white text-center py-2 px-4 text-sm font-medium shadow-lg">
      <span className="flex items-center justify-center gap-2">
        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        Reconnecting to server...
      </span>
    </div>
  );
}

function AppContent() {
  const { screen, error } = useGame();

  return (
    <>
      <ConnectionBanner />
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
          {error}
        </div>
      )}
      {screen === 'login' && <LoginScreen />}
      {screen === 'browser' && <LobbyBrowser />}
      {screen === 'lobby' && <LobbyRoom />}
      {screen === 'game' && <GameScreen />}
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
