import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  // Socket Auth & Room Join
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dohssheba_jwt_secret_dev_key_2026'
      ) as { id: string; role: string; email: string };

      socket.data.user = decoded;
      next();
    } catch (err) {
      console.warn('⚠️ Socket connection unauthenticated or token expired.');
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;

    if (user) {
      console.log(`⚡ Socket connected: User ${user.id} (${user.role})`);
      socket.join(`user_${user.id}`);
      socket.join(`role_${user.role}`);

      if (user.role === 'SELLER') {
        socket.join(`seller_${user.id}`);
      }

      if (user.role === 'RIDER') {
        socket.join('online_riders');
      }

      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        socket.join('admin_fleet');
      }
    } else {
      console.log(`⚡ Socket connected: Anonymous (${socket.id})`);
    }

    socket.on('join_order', (orderId: string) => {
      socket.join(`order_${orderId}`);
    });

    socket.on('leave_order', (orderId: string) => {
      socket.leave(`order_${orderId}`);
    });

    socket.on('join_seller', (sellerId: string) => {
      socket.join(`seller_${sellerId}`);
    });

    socket.on('register_rider', () => {
      console.log(`🚴 Rider socket registered into online_riders room: Socket ${socket.id} (User: ${user?.id || 'anonymous'})`);
      socket.join('online_riders');
    });

    // ── Real-Time GPS Tracking Listener ──────────────────────────────────────
    socket.on('RIDER_LOCATION_UPDATED', async (data: {
      orderId?: string;
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
      timestamp?: number;
    }) => {
      const riderId = user?.id;
      if (!riderId || !data.latitude || !data.longitude) return;

      const locationPayload = {
        riderId,
        orderId: data.orderId || null,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        heading: Number(data.heading || 0),
        speed: Number(data.speed || 0),
        accuracy: Number(data.accuracy || 0),
        timestamp: data.timestamp || Date.now(),
      };

      // Async database persistence & profile update (non-blocking for fast throughput)
      const { prisma } = require('./prisma');
      try {
        await prisma.riderProfile.updateMany({
          where: { userId: riderId },
          data: {
            currentLatitude: locationPayload.latitude,
            currentLongitude: locationPayload.longitude,
            heading: locationPayload.heading,
            speed: locationPayload.speed,
            accuracy: locationPayload.accuracy,
            lastHeartbeat: new Date(),
          },
        });

        if (locationPayload.orderId) {
          await prisma.riderLocation.create({
            data: {
              riderId,
              orderId: locationPayload.orderId,
              latitude: locationPayload.latitude,
              longitude: locationPayload.longitude,
              heading: locationPayload.heading,
              speed: locationPayload.speed,
              accuracy: locationPayload.accuracy,
            },
          });
        }
      } catch (e) {
        console.warn('⚠️ Rider location persistence warning:', e);
      }

      // Broadcast to Order Room, Admin Fleet Room, and User
      if (locationPayload.orderId) {
        io?.to(`order_${locationPayload.orderId}`).emit('RIDER_LOCATION_UPDATED', locationPayload);
      }
      io?.to('admin_fleet').emit('RIDER_LOCATION_UPDATED', locationPayload);
      io?.to('role_ADMIN').emit('RIDER_LOCATION_UPDATED', locationPayload);
      io?.to('role_SUPER_ADMIN').emit('RIDER_LOCATION_UPDATED', locationPayload);

      // Acknowledge back to rider
      socket.emit('LOCATION_SYNC_ACK', { timestamp: locationPayload.timestamp });
    });

    socket.on('disconnect', () => {
      if (user) {
        console.log(`🔌 Socket disconnected: User ${user.id}`);
      }
    });
  });

  console.log('✅ Socket.IO initialized successfully.');
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized! Call initSocket(server) first.');
  }
  return io;
};

// ── Event Emitters ─────────────────────────────────────────────────────────────

export const emitToUser = (userId: string, event: string, payload: any) => {
  if (io) io.to(`user_${userId}`).emit(event, payload);
};

export const emitToRole = (role: string, event: string, payload: any) => {
  if (io) io.to(`role_${role}`).emit(event, payload);
};

export const emitToAdminRoom = (event: string, payload: any) => {
  if (io) {
    io.to('role_ADMIN').emit(event, payload);
    io.to('role_SUPER_ADMIN').emit(event, payload);
  }
};

export const emitToOnlineRiders = (event: string, payload: any) => {
  if (io) {
    const room = io.sockets.adapter.rooms.get('online_riders');
    const riderCount = room ? room.size : 0;
    console.log(`📡 [SOCKET BROADCAST] Event: ${event} | Room: online_riders | Connected Sockets in Room: ${riderCount} | Order ID: ${payload?.orderId || 'N/A'}`);
    io.to('online_riders').emit(event, payload);
    io.to('role_RIDER').emit(event, payload);
    io.emit(event, payload);
  }
};

export const emitToSellerRoom = (sellerId: string, event: string, payload: any) => {
  if (io) {
    if (sellerId) {
      io.to(`seller_${sellerId}`).emit(event, payload);
      io.to(`user_${sellerId}`).emit(event, payload);
    }
    io.to('role_SELLER').emit(event, payload);
    io.emit(event, payload);
  }
};

export const emitToOrderRoom = (orderId: string, event: string, payload: any) => {
  if (io) io.to(`order_${orderId}`).emit(event, payload);
};

