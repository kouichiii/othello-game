import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(url: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // WebSocketサーバーを初期化
    fetch("/api/socket")
      .then(() => {
        // サーバーが初期化されたら、クライアントを接続
        socketRef.current = io({
          path: "/api/socket",
          addTrailingSlash: false,
        });

        socketRef.current.on("connect", () => {
          console.log("Connected to Socket.io server");
        });

        socketRef.current.on("disconnect", () => {
          console.log("Disconnected from Socket.io server");
        });
      })
      .catch(console.error);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url]);

  return socketRef.current;
} 