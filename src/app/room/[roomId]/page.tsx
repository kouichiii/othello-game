"use client";

import { useParams, useRouter } from "next/navigation";
import { useMultiplayer } from "@/hooks/use-multiplayer";
import OthelloBoard from "@/components/othello/othello-board";
import { useEffect, useState, useCallback } from "react";
import { GameResultModal } from "@/components/othello/game-result-modal";
import type { Board, CellState } from "@/components/othello/types";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

// 8方向の移動ベクトル
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1]
];

export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const {
    gameState,
    playerColor,
    isConnected,
    opponentDisconnected,
    makeMove,
    leaveGame,
    resetGame,
    error,
  } = useMultiplayer(roomId as string);

  const [showGameResult, setShowGameResult] = useState(false);

  // 有効な手かどうかをチェック
  const isValidMove = useCallback((board: Board, row: number, col: number, player: CellState): boolean => {
    if (!player || board[row * 8 + col] !== null) return false;

    for (const [dRow, dCol] of DIRECTIONS) {
      let newRow = row + dRow;
      let newCol = col + dCol;
      let hasOpponentPiece = false;

      while (
        newRow >= 0 && newRow < 8 &&
        newCol >= 0 && newCol < 8
      ) {
        const cell = board[newRow * 8 + newCol];
        if (cell === null) break;
        if (cell === player) {
          if (hasOpponentPiece) return true;
          break;
        }
        hasOpponentPiece = true;
        newRow += dRow;
        newCol += dCol;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    if (opponentDisconnected) {
      alert("対戦相手が切断しました");
    }
  }, [opponentDisconnected]);

  useEffect(() => {
    if (gameState?.gameOver && !showGameResult) {
      setShowGameResult(true);
    }
  }, [gameState?.gameOver, showGameResult]);

  const handleReset = useCallback(() => {
    resetGame();
    setShowGameResult(false);
  }, [resetGame]);

  const handleLeaveRoom = useCallback(() => {
    leaveGame();
    router.push('/');
  }, [leaveGame, router]);

  if (!isConnected || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 p-8 rounded-xl bg-white shadow-xl"
        >
          <h1 className="text-3xl font-bold text-gray-800">接続中...</h1>
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-600" />
          </div>
          <p className="text-gray-600 text-lg">対戦相手を待っています</p>
        </motion.div>
      </div>
    );
  }

  // インデックスが有効な手かどうかをチェック
  const isValidIndex = (index: number): boolean => {
    if (!gameState || opponentDisconnected || gameState.gameOver) return false;
    if (gameState.currentPlayer !== playerColor) return false;
    
    const row = Math.floor(index / 8);
    const col = index % 8;
    return isValidMove(gameState.board, row, col, playerColor);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 space-y-4"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-6">オンライン対戦</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <motion.div 
              className={`p-4 rounded-lg shadow-md ${
                playerColor === "black" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-lg font-medium">あなたの色</p>
              <p className="text-2xl font-bold mt-1">
                {playerColor === "black" ? "黒" : "白"}
              </p>
            </motion.div>

            <motion.div 
              className={`p-4 rounded-lg shadow-md ${
                gameState.currentPlayer === "black" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-lg font-medium">現在の手番</p>
              <p className="text-2xl font-bold mt-1">
                {gameState.currentPlayer === "black" ? "黒" : "白"}
              </p>
            </motion.div>
          </div>

          <AnimatePresence>
            {(error || opponentDisconnected) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg max-w-2xl mx-auto"
              >
                <p className="text-red-700">
                  {error || "対戦相手が切断しました"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <OthelloBoard
            board={gameState.board}
            currentPlayer={gameState.currentPlayer}
            onCellClick={(row: number, col: number) => {
              if (gameState.currentPlayer === playerColor && !opponentDisconnected) {
                makeMove(row * 8 + col);
              }
            }}
            gameOver={gameState.gameOver}
            counts={gameState.counts}
            showHints={gameState.currentPlayer === playerColor}
            isValidMove={isValidIndex}
          />

          <div className="mt-8 flex justify-center gap-8">
            <motion.div 
              className="flex items-center gap-3 p-4 rounded-lg bg-gray-800 text-white"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-6 h-6 rounded-full bg-black" />
              <span className="text-xl font-bold">{gameState.counts.black}</span>
            </motion.div>

            <motion.div 
              className="flex items-center gap-3 p-4 rounded-lg bg-white shadow-md"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-800" />
              <span className="text-xl font-bold text-gray-800">{gameState.counts.white}</span>
            </motion.div>
          </div>
        </motion.div>

        {showGameResult && (
          <GameResultModal
            isOpen={true}
            onClose={handleLeaveRoom}
            onReset={handleReset}
            counts={gameState.counts}
            isOnlineMode={true}
          />
        )}
      </div>
    </div>
  );
} 