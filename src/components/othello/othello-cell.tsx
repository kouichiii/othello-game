import { type CellState } from "./types";
import { motion } from "framer-motion";

interface OthelloCellProps {
  cell: CellState;
  isValid: boolean;
  showHint: boolean;
  onClick: () => void;
}

export function OthelloCell({ cell, isValid, showHint, onClick }: OthelloCellProps) {
  return (
    <motion.div
      whileHover={isValid ? { scale: 1.05 } : undefined}
      className={`w-12 h-12 bg-green-600 flex items-center justify-center cursor-pointer ${
        isValid ? 'hover:bg-green-500' : ''
      } relative rounded-sm border border-green-700`}
      onClick={onClick}
    >
      <motion.div
        initial={cell ? { scale: 0 } : false}
        animate={cell ? { scale: 1 } : false}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`w-10 h-10 rounded-full transition-all duration-300 ${
          cell === 'black'
            ? 'bg-gray-900 shadow-lg'
            : cell === 'white'
            ? 'bg-white border-2 border-gray-200 shadow-lg'
            : 'bg-transparent'
        }`}
      />
      {showHint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-3 h-3 rounded-full bg-yellow-400/70 shadow-lg"
          />
        </motion.div>
      )}
    </motion.div>
  );
} 