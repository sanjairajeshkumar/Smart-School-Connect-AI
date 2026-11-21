const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

class SocketService {
  constructor() {
    this.io = null;
  }

  init(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // Allows development and production frontend origins
        methods: ['GET', 'POST'],
      },
    });

    // Authenticate socket connections
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        // Allow unauthenticated connection for public announcements or pass with anonymous
        socket.user = null;
        return next();
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        socket.user = decoded;
        next();
      } catch (err) {
        console.warn('[Socket.io] Auth token invalid, proceeding unauthenticated:', err.message);
        socket.user = null;
        next();
      }
    });

    this.io.on('connection', (socket) => {
      if (socket.user) {
        const { id, role, schoolId, classId } = socket.user;
        
        // Join personal user room
        socket.join(`user:${id}`);
        
        // Join school tenant room
        if (schoolId) {
          socket.join(`school:${schoolId}`);
        }
        
        // Join class room
        if (classId) {
          socket.join(`class:${classId}`);
        }

        console.log(`[Socket.io] User connected: ${id} (${role}) in school: ${schoolId || 'none'}`);
      } else {
        console.log('[Socket.io] Anonymous client connected:', socket.id);
      }

      // Allow client to dynamically join specific room
      socket.on('join:room', (room) => {
        socket.join(room);
        console.log(`[Socket.io] Socket ${socket.id} joined room ${room}`);
      });

      socket.on('disconnect', () => {
        // Disconnected
      });
    });

    console.log('[Socket.io] Real-time WebSocket server initialized');
  }

  emitToSchool(schoolId, event, data) {
    if (!this.io || !schoolId) return;
    this.io.to(`school:${schoolId}`).emit(event, data);
  }

  emitToClass(classId, event, data) {
    if (!this.io || !classId) return;
    this.io.to(`class:${classId}`).emit(event, data);
  }

  emitToUser(userId, event, data) {
    if (!this.io || !userId) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  emitToAll(event, data) {
    if (!this.io) return;
    this.io.emit(event, data);
  }
}

module.exports = new SocketService();
