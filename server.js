const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('joinGame', (roomId) => {
      console.log(`Client joining room: ${roomId}`);
      socket.join(roomId);

      // ルームの参加者数を確認
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room && room.size === 2) {
        // 2人が揃ったらゲーム開始
        io.to(roomId).emit('gameStarted');
      }
    });

    socket.on('makeMove', (data) => {
      const { roomId, move } = data;
      // 手の情報を同じルームの他のプレイヤーに送信
      socket.to(roomId).emit('moveMade', move);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 