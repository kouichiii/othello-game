import { useCallback, useState, useEffect } from "react";
import type { Board, CellState, Direction, GameState, AIDifficulty } from "./types";
import { findBestMove } from "./ai-player";

const BOARD_SIZE = 8;
const INITIAL_BOARD: Board = Array(64).fill(null);

// 初期配置を設定
INITIAL_BOARD[27] = 'white';
INITIAL_BOARD[28] = 'black';
INITIAL_BOARD[35] = 'black';
INITIAL_BOARD[36] = 'white';

// 8方向の移動ベクトル
const DIRECTIONS: Direction[] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

const INITIAL_GAME_STATE: GameState = {
  board: [...INITIAL_BOARD],
  currentPlayer: 'black',
  gameOver: false,
  counts: { black: 2, white: 2 },
  isAIEnabled: false,
  aiPlayer: 'white',
  aiDifficulty: 'medium',
};

export function useOthelloGame() {
  const [gameState, setGameState] = useState<GameState>({ ...INITIAL_GAME_STATE });

  // 座標からインデックスを計算
  const getIndex = useCallback((row: number, col: number) => row * BOARD_SIZE + col, []);
  
  // インデックスから座標を計算
  const getCoordinates = useCallback((index: number) => ({
    row: Math.floor(index / BOARD_SIZE),
    col: index % BOARD_SIZE
  }), []);

  // 指定された方向に石を返せるかチェック
  const canFlipInDirection = useCallback((index: number, direction: Direction): number[] => {
    const { row, col } = getCoordinates(index);
    const [dRow, dCol] = direction;
    let newRow = row + dRow;
    let newCol = col + dCol;
    const flippable: number[] = [];

    while (
      newRow >= 0 && newRow < BOARD_SIZE &&
      newCol >= 0 && newCol < BOARD_SIZE
    ) {
      const newIndex = getIndex(newRow, newCol);
      const cell = gameState.board[newIndex];

      if (cell === null) return [];
      if (cell === gameState.currentPlayer) return flippable;
      flippable.push(newIndex);

      newRow += dRow;
      newCol += dCol;
    }

    return [];
  }, [gameState.board, gameState.currentPlayer, getCoordinates, getIndex]);

  // 有効な手かどうかチェック
  const isValidMove = useCallback((index: number): boolean => {
    if (gameState.board[index] !== null) return false;
    return DIRECTIONS.some(dir => canFlipInDirection(index, dir).length > 0);
  }, [canFlipInDirection, gameState.board]);

  // 有効な手の一覧を取得
  const getValidMoves = useCallback((): number[] => {
    const moves: number[] = [];
    for (let i = 0; i < 64; i++) {
      if (isValidMove(i)) {
        moves.push(i);
      }
    }
    return moves;
  }, [isValidMove]);

  // 石の数を計算
  const calculateCounts = useCallback((board: Board) => {
    return board.reduce(
      (acc, cell) => {
        if (cell === 'black') acc.black++;
        if (cell === 'white') acc.white++;
        return acc;
      },
      { black: 0, white: 0 }
    );
  }, []);

  // ゲーム終了判定
  const checkGameOver = useCallback((board: Board, counts: { black: number; white: number }, hasValidMove: boolean): boolean => {
    // いずれかの石が0個になった場合
    if (counts.black === 0 || counts.white === 0) return true;
    
    // 盤面が埋まった場合
    if (board.every(cell => cell !== null)) return true;
    
    // 有効な手がない場合
    if (!hasValidMove && !board.some((_, idx) => isValidMove(idx))) return true;
    
    return false;
  }, [isValidMove]);

  // 石を置く
  const makeMove = useCallback((index: number) => {
    if (gameState.gameOver || !isValidMove(index)) return;

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;

    // 全方向の石を返す
    DIRECTIONS.forEach(dir => {
      const flippable = canFlipInDirection(index, dir);
      flippable.forEach(idx => {
        newBoard[idx] = gameState.currentPlayer;
      });
    });

    const nextPlayer = gameState.currentPlayer === 'black' ? 'white' : 'black';
    const counts = calculateCounts(newBoard);

    // 次のプレイヤーの手番を計算
    const hasValidMove = newBoard.some((_, idx) => {
      if (newBoard[idx] !== null) return false;
      return DIRECTIONS.some(dir => {
        const { row, col } = getCoordinates(idx);
        let newRow = row + dir[0];
        let newCol = col + dir[1];
        let foundOpponent = false;

        while (
          newRow >= 0 && newRow < BOARD_SIZE &&
          newCol >= 0 && newCol < BOARD_SIZE
        ) {
          const newIndex = getIndex(newRow, newCol);
          const cell = newBoard[newIndex];

          if (cell === null) return false;
          if (cell === nextPlayer) return foundOpponent;
          foundOpponent = true;

          newRow += dir[0];
          newCol += dir[1];
        }

        return false;
      });
    });

    const isGameOver = checkGameOver(newBoard, counts, hasValidMove);

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: hasValidMove ? nextPlayer : prev.currentPlayer,
      gameOver: isGameOver,
      counts,
    }));
  }, [gameState, isValidMove, canFlipInDirection, getCoordinates, getIndex, calculateCounts, checkGameOver]);

  // プレイヤーの手
  const handleCellClick = useCallback((index: number) => {
    if (gameState.isAIEnabled && gameState.currentPlayer === gameState.aiPlayer) return;
    makeMove(index);
  }, [gameState.isAIEnabled, gameState.currentPlayer, gameState.aiPlayer, makeMove]);

  // AIの難易度を変更
  const changeAIDifficulty = useCallback((difficulty: AIDifficulty) => {
    setGameState(prev => ({
      ...prev,
      aiDifficulty: difficulty,
    }));
  }, []);

  // AIの手
  useEffect(() => {
    if (
      gameState.isAIEnabled &&
      gameState.currentPlayer === gameState.aiPlayer &&
      !gameState.gameOver
    ) {
      // AIの思考時間を演出するための遅延（難易度に応じて調整）
      const thinkingTime = gameState.aiDifficulty === 'hard' ? 1500 : 
                          gameState.aiDifficulty === 'medium' ? 1000 : 500;

      const timeoutId = setTimeout(() => {
        const validMoves = getValidMoves();
        const bestMove = findBestMove(
          gameState.board,
          validMoves,
          (index) => canFlipInDirection(index, DIRECTIONS[0]).concat(
            ...DIRECTIONS.slice(1).map(dir => canFlipInDirection(index, dir))
          ),
          gameState.currentPlayer,
          gameState.aiDifficulty,
          // 難しいAI用の追加パラメータ
          (board, player) => {
            const moves: number[] = [];
            for (let i = 0; i < 64; i++) {
              if (board[i] === null && DIRECTIONS.some(dir => {
                let row = Math.floor(i / BOARD_SIZE) + dir[0];
                let col = (i % BOARD_SIZE) + dir[1];
                let foundOpponent = false;
                
                while (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
                  const cell = board[row * BOARD_SIZE + col];
                  if (cell === null) return false;
                  if (cell === player) return foundOpponent;
                  foundOpponent = true;
                  row += dir[0];
                  col += dir[1];
                }
                
                return false;
              })) {
                moves.push(i);
              }
            }
            return moves;
          },
          (board, index, player) => {
            const newBoard = [...board];
            newBoard[index] = player;
            DIRECTIONS.forEach(dir => {
              let row = Math.floor(index / BOARD_SIZE) + dir[0];
              let col = (index % BOARD_SIZE) + dir[1];
              const flippable: number[] = [];
              
              while (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
                const idx = row * BOARD_SIZE + col;
                const cell = newBoard[idx];
                if (cell === null) break;
                if (cell === player) {
                  flippable.forEach(idx => newBoard[idx] = player);
                  break;
                }
                flippable.push(idx);
                row += dir[0];
                col += dir[1];
              }
            });
            return newBoard;
          }
        );
        
        if (bestMove !== -1) {
          makeMove(bestMove);
        }
      }, thinkingTime);

      return () => clearTimeout(timeoutId);
    }
  }, [gameState, getValidMoves, canFlipInDirection, makeMove]);

  // AIの有効/無効を切り替え
  const toggleAI = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isAIEnabled: !prev.isAIEnabled,
    }));
  }, []);

  // ゲームをリセット
  const resetGame = useCallback(() => {
    setGameState({ ...INITIAL_GAME_STATE });
  }, []);

  return {
    ...gameState,
    handleCellClick,
    isValidMove,
    resetGame,
    toggleAI,
    changeAIDifficulty,
  };
} 