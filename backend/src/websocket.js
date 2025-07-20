const userSockets = new Map();

function initWebSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join', (userId) => {
      userSockets.set(userId, socket.id);
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined with socket ${socket.id}`);
    });
    socket.on('disconnect', () => {
      for (let [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
      console.log('User disconnected:', socket.id);
    });
  });
}

export { initWebSocket, userSockets }; 