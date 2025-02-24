export type CellState = 'black' | 'white' | null;
export type Board = CellState[];

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  board: Board;
  currentPlayer: 'black' | 'white';
  gameOver: boolean;
  counts: {
    black: number;
    white: number;
  };
  isAIEnabled: boolean;
  aiPlayer: 'black' | 'white';
  aiDifficulty: AIDifficulty;
}

export type Direction = [number, number]; 