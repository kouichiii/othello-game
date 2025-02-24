"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import type { GameState } from "./types";

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MultiplayerModal({ isOpen, onClose }: MultiplayerModalProps) {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<'black' | 'white' | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connectToSocket = (targetRoomId: string) => {
    if (socketRef.current?.connected) {
      console.log('Already connected, reusing connection');
      socketRef.current.emit('joinGame', targetRoomId);
      return;
    }

    console.log('Creating new connection...');
    const socket = io('http://localhost:3000', {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true,
      forceNew: true
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionError(`サーバーへの接続に失敗しました。(${error.message})`);
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.io server with ID:", socket.id);
      setConnectionError(null);
      console.log("Joining game room:", targetRoomId);
      socket.emit("joinGame", targetRoomId);
    });

    socket.on("error", (message: string) => {
      console.error("Server error:", message);
      setConnectionError(message);
      setIsWaiting(false);
    });

    socket.on("playerAssigned", (color: 'black' | 'white') => {
      console.log("Assigned color:", color);
      setPlayerColor(color);
    });

    socket.on("gameStarted", () => {
      console.log("Game started! Redirecting to room:", targetRoomId);
      try {
        setTimeout(() => {
          const currentPath = window.location.pathname;
          const targetPath = `/room/${targetRoomId}`;
          
          if (currentPath === targetPath) {
            window.location.reload();
          } else {
            window.location.href = targetPath;
          }
        }, 1000);
      } catch (error) {
        console.error("Error redirecting to game room:", error);
        setConnectionError("ゲーム画面への遷移に失敗しました。");
      }
    });

    socket.on("gameState", (state: GameState) => {
      console.log("Received game state:", state);
    });

    socket.on("opponentDisconnected", () => {
      console.log("Opponent disconnected");
      setConnectionError("対戦相手が切断しました。");
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from server. Reason:", reason);
      setConnectionError("サーバーから切断されました。");
      if (reason === "io server disconnect") {
        console.log("Attempting to reconnect...");
        socket.connect();
      }
    });

    socket.on("reconnecting", (attemptNumber) => {
      console.log("Attempting to reconnect... Attempt:", attemptNumber);
      setConnectionError(`再接続を試みています... (${attemptNumber}回目)`);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Reconnected to server after", attemptNumber, "attempts");
      setConnectionError(null);
      if (targetRoomId) {
        console.log("Rejoining game room:", targetRoomId);
        socket.emit("joinGame", targetRoomId);
      }
    });

    socket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
      setConnectionError("再接続に失敗しました。");
    });

    socket.on("reconnect_failed", () => {
      console.error("Failed to reconnect after all attempts");
      setConnectionError("サーバーに接続できません。");
    });

    socketRef.current = socket;
    socket.connect();

    return () => {
      console.log('Cleaning up socket connection...');
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (createdRoomId && isWaiting) {
      cleanup = connectToSocket(createdRoomId);
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [createdRoomId, isWaiting, router]);

  if (!isOpen) return null;

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    setCreatedRoomId(newRoomId);
    setIsWaiting(true);
    setConnectionError(null);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      connectToSocket(roomId);
      setIsWaiting(true);
      setConnectionError(null);
    }
  };

  const handleCopyRoomId = () => {
    if (createdRoomId) {
      navigator.clipboard.writeText(createdRoomId);
      alert('ルームIDをコピーしました');
    }
  };

  const handleCancel = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setCreatedRoomId(null);
    setIsWaiting(false);
    setRoomId('');
    setConnectionError(null);
  };

  if (createdRoomId || (roomId && isWaiting)) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6">
            {createdRoomId ? 'ルーム作成完了' : 'ルームに参加中'}
          </h2>
          
          <div className="space-y-6">
            {createdRoomId && (
              <div className="text-center">
                <p className="text-gray-600 mb-2">以下のルームIDを対戦相手に共有してください：</p>
                <div className="bg-gray-100 p-4 rounded-lg text-2xl font-mono font-bold select-all">
                  {createdRoomId}
                </div>
              </div>
            )}

            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
              <p className="text-gray-600">
                {createdRoomId ? '対戦相手の参加を待っています...' : 'ルームに接続中...'}
              </p>
              {playerColor && (
                <p className="text-gray-600 mt-2">
                  あなたは{playerColor === 'black' ? '黒' : '白'}です
                </p>
              )}
              {connectionError && (
                <p className="text-red-500 mt-2">{connectionError}</p>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {createdRoomId && (
                <button
                  onClick={handleCopyRoomId}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  ルームIDをコピー
                </button>
              )}
              <button
                onClick={handleCancel}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">マルチプレイヤーモード</h2>
        
        <div className="space-y-6">
          <div>
            <button
              onClick={handleCreateRoom}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              新しいルームを作成
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-gray-600">または、ルームIDを入力して参加</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="ルームID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleJoinRoom}
                disabled={!roomId.trim()}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors disabled:bg-gray-300"
              >
                参加
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
} 