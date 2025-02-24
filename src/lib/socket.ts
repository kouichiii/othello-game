import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";
import type { GameState, Board, CellState } from "@/components/othello/types";

export type NextSocketIOServer = SocketIOServer | undefined;

export let io: SocketIOServer;

interface GameRoom {
  players: {
    black?: string;
    white?: string;
  };
  gameState: GameState;
}

// 8方向の移動ベクトル
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1]
];

// ゲームロジックのヘルパー関数
function isValidMove(board: Board, row: number, col: number, player: CellState): boolean {
  if (board[row * 8 + col] !== null) return false;

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
}

function makeMove(board: Board, row: number, col: number, player: CellState): Board {
  const newBoard = [...board];
  newBoard[row * 8 + col] = player;

  for (const [dRow, dCol] of DIRECTIONS) {
    let newRow = row + dRow;
    let newCol = col + dCol;
    const piecesToFlip: number[] = [];

    while (
      newRow >= 0 && newRow < 8 &&
      newCol >= 0 && newCol < 8
    ) {
      const index = newRow * 8 + newCol;
      const cell = newBoard[index];
      if (cell === null) break;
      if (cell === player) {
        piecesToFlip.forEach(idx => {
          newBoard[idx] = player;
        });
        break;
      }
      piecesToFlip.push(index);
      newRow += dRow;
      newCol += dCol;
    }
  }

  return newBoard;
}

function calculateCounts(board: Board): { black: number; white: number } {
  return board.reduce(
    (acc, cell) => {
      if (cell === 'black') acc.black++;
      if (cell === 'white') acc.white++;
      return acc;
    },
    { black: 0, white: 0 }
  );
}

function hasValidMoves(board: Board, player: CellState): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isValidMove(board, row, col, player)) {
        return true;
      }
    }
  }
  return false;
}

// ルーム管理用のMap
const gameRooms = new Map<string, GameRoom>();

// 初期ボード状態を作成する関数
function createInitialBoard(): Board {
  const board = Array(64).fill(null);
  board[27] = 'white';
  board[28] = 'black';
  board[35] = 'black';
  board[36] = 'white';
  return board;
}

// 初期ゲーム状態を作成する関数
function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: 'black',
    gameOver: false,
    counts: { black: 2, white: 2 },
    isAIEnabled: false,
    aiPlayer: 'white',
    aiDifficulty: 'medium',
  };
}

export const initSocketServer = (server: NetServer) => {
  if (io) {
    console.log('Socket server already initialized');
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2000
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let currentRoom: string | null = null;
    
    socket.on('joinGame', (roomId: string) => {
      try {
        console.log(`Client ${socket.id} joining room: ${roomId}`);
        
        // 以前のルームから退出
        if (currentRoom) {
          leaveCurrentRoom();
        }

        // 新しいルームを取得または作成
        let room = gameRooms.get(roomId);
        if (!room) {
          console.log(`Creating new room: ${roomId}`);
          room = {
            players: {},
            gameState: {
              board: Array(64).fill(null),
              currentPlayer: 'black',
              gameOver: false,
              counts: { black: 2, white: 2 },
              isAIEnabled: false,
              aiPlayer: 'white',
              aiDifficulty: 'medium',
            }
          };
          // 初期配置を設定
          room.gameState.board[27] = 'white';
          room.gameState.board[28] = 'black';
          room.gameState.board[35] = 'black';
          room.gameState.board[36] = 'white';
          gameRooms.set(roomId, room);
        }

        // ルームが満員かチェック
        if (room.players.black && room.players.white) {
          console.log(`Room ${roomId} is full`);
          socket.emit('error', 'このルームは満員です');
          return;
        }

        // プレイヤーの色を割り当て
        let assignedColor: 'black' | 'white';
        if (!room.players.black) {
          room.players.black = socket.id;
          assignedColor = 'black';
        } else {
          room.players.white = socket.id;
          assignedColor = 'white';
        }

        // ルームに参加
        socket.join(roomId);
        currentRoom = roomId;
        
        // プレイヤーに色を通知
        socket.emit('playerAssigned', assignedColor);
        console.log(`Player ${socket.id} assigned color: ${assignedColor}`);

        // 両プレイヤーが揃ったらゲーム開始
        if (room.players.black && room.players.white) {
          console.log(`Starting game in room: ${roomId}`);
          io.in(roomId).emit('gameStarted');
          io.in(roomId).emit('gameState', room.gameState);
          
          console.log('Game started, notifying players:', {
            black: room.players.black,
            white: room.players.white,
            state: room.gameState
          });
        }

      } catch (error) {
        console.error('Error in joinGame:', error);
        socket.emit('error', 'ゲームへの参加中にエラーが発生しました');
      }
    });

    socket.on('makeMove', (index: number) => {
      if (!currentRoom) return;

      const room = gameRooms.get(currentRoom);
      if (!room) return;

      // プレイヤーの色を確認
      const isBlack = room.players.black === socket.id;
      const isWhite = room.players.white === socket.id;
      const playerColor = isBlack ? 'black' : isWhite ? 'white' : null;

      // 正しいプレイヤーの手番かチェック
      if (!playerColor || playerColor !== room.gameState.currentPlayer) {
        socket.emit('error', '相手の手番です');
        return;
      }

      const row = Math.floor(index / 8);
      const col = index % 8;

      // 手が有効かチェック
      if (!isValidMove(room.gameState.board, row, col, playerColor)) {
        socket.emit('error', 'そこには置けません');
        return;
      }

      // 手を反映
      const newBoard = makeMove(room.gameState.board, row, col, playerColor);
      const nextPlayer = playerColor === 'black' ? 'white' : 'black';
      
      // 次のプレイヤーが手を打てるかチェック
      const hasNext = hasValidMoves(newBoard, nextPlayer);
      const currentPlayerCanMove = hasValidMoves(newBoard, playerColor);
      
      // 次の手番を決定
      const actualNextPlayer = hasNext ? nextPlayer : 
                             currentPlayerCanMove ? playerColor : null;
      
      // 石の数を計算
      const counts = calculateCounts(newBoard);
      
      // ゲーム終了判定
      const gameOver = actualNextPlayer === null || 
                      counts.black === 0 || 
                      counts.white === 0 || 
                      counts.black + counts.white === 64;

      // ゲーム状態を更新
      room.gameState = {
        ...room.gameState,
        board: newBoard,
        currentPlayer: actualNextPlayer || room.gameState.currentPlayer,
        gameOver,
        counts,
      };

      // 全プレイヤーに新しい状態を送信
      io.in(currentRoom).emit('gameState', room.gameState);
      
      // デバッグログ
      console.log('Move made, updating state:', {
        player: playerColor,
        index,
        newState: room.gameState
      });
    });

    socket.on('resetGame', () => {
      if (!currentRoom) return;

      const room = gameRooms.get(currentRoom);
      if (!room) return;

      // ゲーム状態をリセット
      room.gameState = createInitialGameState();

      // 全プレイヤーに新しい状態を送信
      io.in(currentRoom).emit('gameState', room.gameState);
      console.log(`Game reset in room: ${currentRoom}`);
    });

    const leaveCurrentRoom = () => {
      if (currentRoom) {
        const room = gameRooms.get(currentRoom);
        if (room) {
          // プレイヤーを削除
          if (room.players.black === socket.id) {
            room.players.black = undefined;
          } else if (room.players.white === socket.id) {
            room.players.white = undefined;
          }

          socket.leave(currentRoom);
          
          // 他のプレイヤーに通知
          socket.to(currentRoom).emit('opponentDisconnected');
          
          // ルームが空になったら削除
          if (!room.players.black && !room.players.white) {
            gameRooms.delete(currentRoom);
            console.log(`Room ${currentRoom} deleted (empty)`);
          }
        }
        currentRoom = null;
      }
    };

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      leaveCurrentRoom();
    });
  });

  console.log('Socket server initialized');
  return io;
}; 