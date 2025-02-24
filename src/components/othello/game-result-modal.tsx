"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RefreshCw, X } from "lucide-react";

interface GameResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  counts: {
    black: number;
    white: number;
  };
  isOnlineMode?: boolean;
}

export function GameResultModal({ isOpen, onClose, onReset, counts, isOnlineMode = false }: GameResultModalProps) {
  if (!isOpen) return null;

  const winner = counts.black > counts.white ? '黒' : counts.black < counts.white ? '白' : null;
  const isDraw = counts.black === counts.white;
  const isWipeout = counts.black === 0 || counts.white === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={isOnlineMode ? onClose : onReset}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative z-10"
          >
            {isOnlineMode && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}

            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Trophy className="w-16 h-16 text-yellow-400" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-800">ゲーム終了</h2>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-medium text-gray-600"
                >
                  {isWipeout ? (
                    <p>{counts.black === 0 ? '白の完勝！' : '黒の完勝！'}</p>
                  ) : isDraw ? (
                    <p>引き分けです！</p>
                  ) : (
                    <p>{winner}の勝利です！</p>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-8 p-6 bg-gray-50 rounded-xl"
              >
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-black mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{counts.black}</p>
                  <p className="text-sm text-gray-600">黒</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-800 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{counts.white}</p>
                  <p className="text-sm text-gray-600">白</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onReset}
                  className="flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  もう一度プレイ
                </motion.button>
                {isOnlineMode && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    ルームを退出
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 