import { Server } from "socket.io";
import http from "http"; // ✅ Fixed typo from 'htttps' to 'http'
import express from "express";

const app = express();
const server = http.createServer(app);

// ✅ Set the correct origin to match your frontend (5173)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // <-- match your frontend port
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {}; // { userId : socketId }

io.on("connection", (socket) => {
  try {
    console.log(`User/Socket connected: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      console.log(`User/Socket disconnected: ${socket.id}`);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  } catch (error) {
    console.log("Error in socket connection:", error);
  }
});

export { io, app, server };
