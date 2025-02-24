import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Board, GameState } from '../components/othello/types';

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
}

interface GameRoom {
  players: {
    black?: string;
    white?: string;
  };
  gameState: GameState;
}

const gameRooms = new Map<string, GameRoom>();

export function initializeSocket(httpServer: HTTPServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);

  io.on('connection', (socket) => {
    let currentRoom: string | null = null;

    socket.on('joinGame', (roomId) => {
      // 既存のルームに参加するか、新しいルームを作成
      let room = gameRooms.get(roomId);
      if (!room) {
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

      // プレイヤーの色を割り当て
      let assignedColor: 'black' | 'white' | null = null;
      if (!room.players.black) {
        room.players.black = socket.id;
        assignedColor = 'black';
      } else if (!room.players.white) {
        room.players.white = socket.id;
        assignedColor = 'white';
      }

      if (assignedColor) {
        socket.join(roomId);
        currentRoom = roomId;
        socket.emit('playerAssigned', assignedColor);

        // 両プレイヤーが揃ったらゲーム開始
        if (room.players.black && room.players.white) {
          io.to(roomId).emit('gameStarted');
          io.to(roomId).emit('gameState', room.gameState);
        }
      }
    });

    socket.on('makeMove', (index) => {
      if (!currentRoom) return;

      const room = gameRooms.get(currentRoom);
      if (!room) return;

      // プレイヤーの色を確認
      const isBlack = room.players.black === socket.id;
      const isWhite = room.players.white === socket.id;
      const playerColor = isBlack ? 'black' : isWhite ? 'white' : null;

      // 正しいプレイヤーの手番かチェック
      if (!playerColor || playerColor !== room.gameState.currentPlayer) return;

      // ゲームの状態を更新（実際のゲームロジックはクライアント側と同じ）
      // ここでは簡略化のため、クライアントからの手を信頼する
      io.to(currentRoom).emit('gameState', room.gameState);
    });

    socket.on('leaveGame', () => {
      if (currentRoom) {
        const room = gameRooms.get(currentRoom);
        if (room) {
          // プレイヤーを削除
          if (room.players.black === socket.id) {
            room.players.black = undefined;
          } else if (room.players.white === socket.id) {
            room.players.white = undefined;
          }

          // 相手に通知
          socket.to(currentRoom).emit('opponentDisconnected');

          // ルームが空になったら削除
          if (!room.players.black && !room.players.white) {
            gameRooms.delete(currentRoom);
          }
        }
        socket.leave(currentRoom);
        currentRoom = null;
      }
    });

    socket.on('disconnect', () => {
      if (currentRoom) {
        socket.emit('leaveGame');
      }
    });
  });

  return io;
} 