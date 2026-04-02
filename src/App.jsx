import React from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import LoginScreen from './components/LoginScreen';
import LobbyBrowser from './components/LobbyBrowser';
import LobbyRoom from './components/LobbyRoom';
import GameScreen from './components/GameScreen';

function AppContent() {
  const { screen, error } = useGame();

  return (
    <>
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
