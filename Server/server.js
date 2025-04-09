import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// Enable CORS for all routes
app.use(cors());

const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://watch-together-2025.web.app", // Firebase hosting
      "http://localhost:5173", // Local development
      "http://localhost:3000"  // Alternative local port
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle reconnection
  socket.on('reconnect', () => {
    console.log('User reconnected:', socket.id);
  });

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

  socket.on('join-room', (data) => {
    // Extract roomId from the data object
    const roomId = data.roomId || data;
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

    // Add timestamp to state
    state.timestamp = Date.now()

    // Update room's video state
    room.videoState = state

    // Broadcast to all users in the room except the sender
    socket.to(roomId).emit('video-state-update', { state })
  });

  // Add more frequent sync check
  setInterval(() => {
    rooms.forEach((room, roomId) => {
      if (room.videoState.isPlaying) {
        io.to(roomId).emit('sync-check', {
          timestamp: Date.now(),
          currentTime: room.videoState.currentTime
        })
      }
    })
  }, 1000); // Check every 1 second instead of 5

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
        console.error('Server error:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 