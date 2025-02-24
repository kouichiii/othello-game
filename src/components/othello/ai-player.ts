import type { Board, CellState, AIDifficulty } from "./types";

// マスの重要度を示すスコアマップ
const SCORE_MAP = [
  100, -40, 20,  5,  5, 20, -40, 100,
  -40, -80, -1, -1, -1, -1, -80, -40,
   20,  -1,  5,  1,  1,  5,  -1,  20,
    5,  -1,  1,  0,  0,  1,  -1,   5,
    5,  -1,  1,  0,  0,  1,  -1,   5,
   20,  -1,  5,  1,  1,  5,  -1,  20,
  -40, -80, -1, -1, -1, -1, -80, -40,
  100, -40, 20,  5,  5, 20, -40, 100,
];

// 手の評価を行う
export function evaluateMove(
  board: Board,
  flippableIndices: number[],
  moveIndex: number,
  currentPlayer: CellState
): number {
  let score = SCORE_MAP[moveIndex];

  // 返せる石の数にも重みを付ける
  score += flippableIndices.length * 2;

  // 角の周辺は危険なので、角が取れる場合を除いて避ける
  const isCornerAdjacent = [1, 8, 9, 6, 14, 15, 48, 49, 57, 54, 55, 56].includes(moveIndex);
  const isCorner = [0, 7, 56, 63].includes(moveIndex);
  
  if (isCornerAdjacent && !isCorner) {
    score -= 30;
  }

  return score;
}

// 簡単なAI: ランダムな手を選択
function findRandomMove(validMoves: number[]): number {
  if (validMoves.length === 0) return -1;
  const randomIndex = Math.floor(Math.random() * validMoves.length);
  return validMoves[randomIndex];
}

// 中級AI: 評価関数による手の選択
function findMediumMove(
  board: Board,
  validMoves: number[],
  getFlippableIndices: (index: number) => number[],
  currentPlayer: CellState
): number {
  if (validMoves.length === 0) return -1;

  let bestScore = -Infinity;
  let bestMove = validMoves[0];

  for (const moveIndex of validMoves) {
    const flippableIndices = getFlippableIndices(moveIndex);
    const score = evaluateMove(board, flippableIndices, moveIndex, currentPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestMove = moveIndex;
    }
  }

  return bestMove;
}

// 難しいAI: MinMax法による探索（深さ4）
function findHardMove(
  board: Board,
  validMoves: number[],
  getFlippableIndices: (index: number) => number[],
  currentPlayer: CellState,
  getNextValidMoves: (board: Board, player: CellState) => number[],
  makeMove: (board: Board, index: number, player: CellState) => Board
): number {
  if (validMoves.length === 0) return -1;

  let bestScore = -Infinity;
  let bestMove = validMoves[0];

  for (const moveIndex of validMoves) {
    const newBoard = makeMove(board, moveIndex, currentPlayer);
    const score = minMax(
      newBoard,
      4, // 探索の深さ
      -Infinity,
      Infinity,
      false,
      currentPlayer === 'black' ? 'white' : 'black',
      getNextValidMoves,
      makeMove
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = moveIndex;
    }
  }

  return bestMove;
}

// MinMax法の実装
function minMax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  currentPlayer: CellState,
  getValidMoves: (board: Board, player: CellState) => number[],
  makeMove: (board: Board, index: number, player: CellState) => Board
): number {
  if (depth === 0) {
    return evaluateBoard(board);
  }

  const validMoves = getValidMoves(board, currentPlayer);
  if (validMoves.length === 0) {
    return evaluateBoard(board);
  }

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const moveIndex of validMoves) {
      const newBoard = makeMove(board, moveIndex, currentPlayer);
      const score = minMax(
        newBoard,
        depth - 1,
        alpha,
        beta,
        false,
        currentPlayer === 'black' ? 'white' : 'black',
        getValidMoves,
        makeMove
      );
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const moveIndex of validMoves) {
      const newBoard = makeMove(board, moveIndex, currentPlayer);
      const score = minMax(
        newBoard,
        depth - 1,
        alpha,
        beta,
        true,
        currentPlayer === 'black' ? 'white' : 'black',
        getValidMoves,
        makeMove
      );
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

// 盤面の評価
function evaluateBoard(board: Board): number {
  let score = 0;
  board.forEach((cell, index) => {
    if (cell === 'black') score += SCORE_MAP[index];
    else if (cell === 'white') score -= SCORE_MAP[index];
  });
  return score;
}

// 難易度に応じてAIの手を選択
export function findBestMove(
  board: Board,
  validMoves: number[],
  getFlippableIndices: (index: number) => number[],
  currentPlayer: CellState,
  difficulty: AIDifficulty,
  getValidMoves?: (board: Board, player: CellState) => number[],
  makeMove?: (board: Board, index: number, player: CellState) => Board
): number {
  switch (difficulty) {
    case 'easy':
      return findRandomMove(validMoves);
    case 'medium':
      return findMediumMove(board, validMoves, getFlippableIndices, currentPlayer);
    case 'hard':
      if (!getValidMoves || !makeMove) return findMediumMove(board, validMoves, getFlippableIndices, currentPlayer);
      return findHardMove(board, validMoves, getFlippableIndices, currentPlayer, getValidMoves, makeMove);
    default:
      return findMediumMove(board, validMoves, getFlippableIndices, currentPlayer);
  }
} 