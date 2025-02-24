import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState } from '../components/othello/types';

interface ServerToClientEvents {
  gameState: (state: GameState) => void;
  playerAssigned: (color: 'black' | 'white') => void;
  gameStarted: () => void;
  opponentDisconnected: () => void;
}

interface ClientToServerEvents {
  joinGame: (roomId: string) => void;
  makeMove: (index: number) => void;
  leaveGame: () => void;
  resetGame: () => void;
}

export function useMultiplayer(roomId: string | null) {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [playerColor, setPlayerColor] = useState<'black' | 'white' | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ソケット接続の初期化
  useEffect(() => {
    if (!roomId) return;

    const newSocket = io('http://localhost:3000', {
      autoConnect: false,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      newSocket.emit('joinGame', roomId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setIsGameStarted(false);
      setOpponentDisconnected(false);
    });

    newSocket.on('error', (message: string) => {
      console.error('Game error:', message);
      setError(message);
    });

    newSocket.on('playerAssigned', (color) => {
      setPlayerColor(color);
      setError(null);
    });

    newSocket.on('gameStarted', () => {
      setIsGameStarted(true);
      setOpponentDisconnected(false);
      setError(null);
    });

    newSocket.on('gameState', (state) => {
      setGameState(state);
      setError(null);
    });

    newSocket.on('opponentDisconnected', () => {
      setOpponentDisconnected(true);
      setIsGameStarted(false);
      setError('対戦相手が切断しました');
    });

    newSocket.connect();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [roomId]);

  // 手を打つ
  const makeMove = useCallback((index: number) => {
    if (socket && isGameStarted && !opponentDisconnected) {
      socket.emit('makeMove', index);
    }
  }, [socket, isGameStarted, opponentDisconnected]);

  // ゲームから離脱
  const leaveGame = useCallback(() => {
    if (socket) {
      socket.emit('leaveGame');
      socket.disconnect();
    }
  }, [socket]);

  // ゲームをリセット
  const resetGame = useCallback(() => {
    if (socket && isGameStarted && !opponentDisconnected) {
      socket.emit('resetGame');
    }
  }, [socket, isGameStarted, opponentDisconnected]);

  return {
    isConnected,
    isGameStarted,
    playerColor,
    gameState,
    opponentDisconnected,
    error,
    makeMove,
    leaveGame,
    resetGame,
  };
} 