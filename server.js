const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io/",
    transports: ["polling", "websocket"],
  });

  // Store online users
  const users = new Map(); // userId -> socketId
  const userSockets = new Map(); // socketId -> userId

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // Get userId from handshake query
    const userId = socket.handshake.query.userId;

    if (userId) {
      // Store user mapping
      users.set(userId, socket.id);
      userSockets.set(socket.id, userId);
      
      // Broadcast online users to all clients
      io.emit("online-users", Array.from(users.keys()));
      console.log(`✅ User ${userId} is now online`);
    }

    // Join a chat room
    socket.on("join-room", (room) => {
      socket.join(room);
      console.log(`📚 Socket ${socket.id} joined room: ${room}`);
    });

    // Leave a chat room
    socket.on("leave-room", (room) => {
      socket.leave(room);
      console.log(`📚 Socket ${socket.id} left room: ${room}`);
    });

    // Send message
    socket.on("send-message", (data) => {
      const { chatId, message, senderId, receiverId } = data;
      console.log(`💬 Message from ${senderId} to chat ${chatId}:`, message);

      // Emit to all participants in the chat room
      io.to(chatId).emit("receive-message", {
        ...message,
        senderId,
        chatId,
      });

      // Also send to specific receiver if online
      if (receiverId) {
        const receiverSocketId = users.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive-message", {
            ...message,
            senderId,
            chatId,
          });
        }
      }

      // Confirm message sent to sender
      socket.emit("message-sent", {
        ...message,
        chatId,
        status: "sent",
      });
    });

    // Typing indicator
    socket.on("typing", (data) => {
      const { chatId, receiverId, isTyping } = data;
      
      // Emit to the chat room
      socket.to(chatId).emit("typing-indicator", {
        userId: userSockets.get(socket.id),
        isTyping,
      });

      // Also emit to specific receiver if provided
      if (receiverId) {
        const receiverSocketId = users.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing-indicator", {
            userId: userSockets.get(socket.id),
            isTyping,
          });
        }
      }
    });

    // Mark messages as read
    socket.on("mark-read", (data) => {
      const { chatId, messageId, userId: readerId } = data;
      
      // Emit read receipt to the chat room
      io.to(chatId).emit("read-receipt", {
        messageId,
        userId: readerId,
        chatId,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      const disconnectedUserId = userSockets.get(socket.id);
      
      if (disconnectedUserId) {
        users.delete(disconnectedUserId);
        userSockets.delete(socket.id);
        
        // Broadcast updated online users list
        io.emit("online-users", Array.from(users.keys()));
        console.log(`❌ User ${disconnectedUserId} went offline`);
      }
      
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  // Error handling for the server
  server.on("error", (error) => {
    console.error("Server error:", error);
  });

  // Start the server
  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) {
      console.error("Error starting server:", err);
      throw err;
    }
    console.log(`🚀 Server ready on http://localhost:${port}`);
    console.log(`🔌 Socket.IO server running on port ${port}`);
    console.log(`📡 WebSocket path: /socket.io/`);
  });
});