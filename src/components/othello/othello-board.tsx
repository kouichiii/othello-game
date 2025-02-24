"use client";

import { useState } from "react";
import { OthelloCell } from "./othello-cell";
import { useOthelloGame } from "./use-othello-game";
import { GameResultModal } from "./game-result-modal";
import { MultiplayerModal } from "./multiplayer-modal";
import type { AIDifficulty, Board } from "./types";
import { motion } from "framer-motion";
import { Users, Bot, Lightbulb, RefreshCw } from "lucide-react";

interface OthelloBoardProps {
  board?: Board;
  currentPlayer?: 'black' | 'white';
  onCellClick?: (row: number, col: number) => void;
  gameOver?: boolean;
  counts?: {
    black: number;
    white: number;
  };
  showHints?: boolean;
  isValidMove?: (index: number) => boolean;
}

export default function OthelloBoard({
  board: externalBoard,
  currentPlayer: externalCurrentPlayer,
  onCellClick: externalOnCellClick,
  gameOver: externalGameOver,
  counts: externalCounts,
  showHints: externalShowHints,
  isValidMove: externalIsValidMove,
}: OthelloBoardProps = {}) {
  const {
    board: internalBoard,
    currentPlayer: internalCurrentPlayer,
    gameOver: internalGameOver,
    counts: internalCounts,
    handleCellClick: internalHandleCellClick,
    isValidMove: internalIsValidMove,
    resetGame,
    isAIEnabled,
    aiPlayer,
    aiDifficulty,
    toggleAI,
    changeAIDifficulty,
  } = useOthelloGame();

  const [showModal, setShowModal] = useState(false);
  const [internalShowHints, setInternalShowHints] = useState(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);

  const board = externalBoard ?? internalBoard;
  const currentPlayer = externalCurrentPlayer ?? internalCurrentPlayer;
  const gameOver = externalGameOver ?? internalGameOver;
  const counts = externalCounts ?? internalCounts;
  const showHints = externalShowHints ?? internalShowHints;
  const isValidMoveFn = externalIsValidMove ?? internalIsValidMove;

  if (!externalBoard && gameOver && !showModal) {
    setShowModal(true);
  }

  const handleCellClick = (index: number) => {
    if (externalOnCellClick) {
      const row = Math.floor(index / 8);
      const col = index % 8;
      externalOnCellClick(row, col);
    } else {
      internalHandleCellClick(index);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {!externalBoard && (
        <div className="mb-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <motion.div 
              className={`p-4 rounded-lg shadow-md ${
                currentPlayer === "black" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-lg font-medium">現在の手番</p>
              <p className="text-2xl font-bold mt-1">
                {currentPlayer === "black" ? "黒" : "白"}
              </p>
            </motion.div>

            <motion.div 
              className="p-4 rounded-lg shadow-md bg-white"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleAI}
                  className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                    isAIEnabled
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gray-500 hover:bg-gray-600'
                  } text-white`}
                >
                  <Bot className="w-5 h-5" />
                  {isAIEnabled ? 'AI: ON' : 'AI: OFF'}
                </button>
                {isAIEnabled && (
                  <select
                    value={aiDifficulty}
                    onChange={(e) => changeAIDifficulty(e.target.value as AIDifficulty)}
                    className="px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="easy">簡単</option>
                    <option value="medium">普通</option>
                    <option value="hard">難しい</option>
                  </select>
                )}
              </div>
              {isAIEnabled && (
                <p className="text-sm text-gray-600 mt-2">
                  AI: {aiPlayer === 'black' ? '黒' : '白'}
                </p>
              )}
            </motion.div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setInternalShowHints(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                showHints
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-gray-500 hover:bg-gray-600'
              } text-white`}
              title="有効な手を表示"
            >
              <Lightbulb className="w-5 h-5" />
              ヒント {showHints ? 'OFF' : 'ON'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMultiplayerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              <Users className="w-5 h-5" />
              マルチプレイヤー
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              リセット
            </motion.button>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-700 p-6 rounded-xl shadow-xl"
      >
        <div className="grid grid-cols-8 gap-1">
          {board.map((cell, index) => (
            <OthelloCell
              key={index}
              cell={cell}
              isValid={!gameOver && isValidMoveFn(index)}
              showHint={showHints && !gameOver && isValidMoveFn(index)}
              onClick={() => handleCellClick(index)}
            />
          ))}
        </div>
      </motion.div>

      {/* 外部から渡された場合（オンライン対戦時）は石の数を表示しない */}
      {!externalBoard && (
        <div className="mt-8 flex justify-center gap-8">
          <motion.div 
            className="flex items-center gap-3 p-4 rounded-lg bg-gray-800 text-white"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-6 h-6 rounded-full bg-black shadow-lg" />
            <span className="text-xl font-bold">{counts.black}</span>
          </motion.div>

          <motion.div 
            className="flex items-center gap-3 p-4 rounded-lg bg-white shadow-md"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-200 shadow-lg" />
            <span className="text-xl font-bold text-gray-800">{counts.white}</span>
          </motion.div>
        </div>
      )}

      {!externalBoard && (
        <>
          <GameResultModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            counts={counts}
            onReset={() => {
              setShowModal(false);
              resetGame();
            }}
            isOnlineMode={false}
          />

          <MultiplayerModal
            isOpen={showMultiplayerModal}
            onClose={() => setShowMultiplayerModal(false)}
          />
        </>
      )}
    </div>
  );
} 