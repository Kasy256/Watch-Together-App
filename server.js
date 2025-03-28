import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', ({ roomId, roomName, hostName, service, contentUrl, hostId, hostPhoto }) => {
    console.log(`Creating room: ${roomId} (${roomName}) by ${hostName}`);
    
    // Create a new room
    rooms.set(roomId, {
      id: roomId,
      name: roomName,
      host: {
        id: hostId,
        name: hostName,
        photo: hostPhoto
      },
      service,
      contentUrl,
      participants: new Set([socket.id]),
      videoState: {
        isPlaying: false,
        currentTime: 0,
        playbackRate: 1,
        videoId: contentUrl ? contentUrl.match(/[?&]v=([^&]+)/)?.[1] : null
      }
    });

    socket.join(roomId);
    socket.emit('room-created');
    console.log(`Room created successfully: ${roomId}`);
    console.log('Current rooms:', Array.from(rooms.keys()));
  });

  socket.on('join-room', (roomId) => {
    console.log(`User ${socket.id} attempting to join room: ${roomId}`);
    const room = rooms.get(roomId);
    
    if (room) {
      room.participants.add(socket.id);
      socket.join(roomId);
      
      socket.emit('room-joined', {
        roomName: room.name,
        hostName: room.host.name,
        hostId: room.host.id,
        hostPhoto: room.host.photo,
        service: room.service,
        contentUrl: room.contentUrl,
        videoState: room.videoState
      });

      socket.to(roomId).emit('participant-joined', socket.id);
      console.log(`User ${socket.id} joined room ${roomId} successfully`);
      console.log(`Room ${roomId} participants:`, Array.from(room.participants));
    } else {
      console.log(`Room ${roomId} not found`);
      socket.emit('room-not-found');
    }
  });

  socket.on('video-state', (data) => {
    const { roomId, state } = data
    if (!roomId || !state) return

    const room = rooms.get(roomId)
    if (!room) return

    // Update room's video state
    room.videoState = state

    // Broadcast to all users in the room except the sender
    socket.to(roomId).emit('video-state-update', { state })
  });

  socket.on('chat-message', ({ roomId, message }) => {
    socket.to(roomId).emit('chat-message', {
      userId: socket.id,
      message
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all rooms they were in
    rooms.forEach((room, roomId) => {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);
        io.to(roomId).emit('participant-left', socket.id);
        
        // If room is empty, delete it
        if (room.participants.size === 0) {
          rooms.delete(roomId);
          console.log(`Room deleted: ${roomId}`);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
const startServer = async () => {
  try {
    await new Promise((resolve, reject) => {
      httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        resolve();
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${PORT} is busy, trying ${PORT + 1}`);
          httpServer.listen(PORT + 1, () => {
            console.log(`Server running on port ${PORT + 1}`);
            resolve();
          });
        } else {
          reject(err);
        }
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 