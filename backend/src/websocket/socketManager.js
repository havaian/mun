const jwt = require('jsonwebtoken');
const { User } = require('../auth/model');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

// Store for socket connections organized by rooms
const socketRooms = new Map();
const userSockets = new Map(); // userId -> socket mapping

// Initialize WebSocket functionality
const initializeWebSocket = (io) => {
    // Authentication middleware for Socket.io
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            // Remove 'Bearer ' prefix if present
            const cleanToken = token.replace('Bearer ', '');

            // Verify JWT
            const decoded = jwt.verify(cleanToken, JWT_SECRET);

            // Get user details
            const user = await User.findById(decoded.userId).populate('committeeId');

            if (!user || !user.isActive) {
                return next(new Error('User not found or inactive'));
            }

            // Attach user info to socket
            socket.userId = user._id.toString();
            socket.userRole = user.role;
            socket.countryName = user.countryName;
            socket.committeeId = user.committeeId?._id?.toString();
            socket.presidiumRole = user.presidiumRole;
            socket.specialRole = user.specialRole;
            socket.email = user.email;

            logger.info(`Socket authenticated: ${user.countryName || user.username} (${user.role})`);
            next();

        } catch (error) {
            logger.warn('Socket authentication failed:', error.message);
            next(new Error('Authentication failed'));
        }
    });

    // Handle connections
    io.on('connection', (socket) => {
        const {
            userId,
            userRole,
            countryName,
            committeeId,
            presidiumRole,
            specialRole
        } = socket;

        logger.info(`Socket connected: ${countryName || userId} (${userRole})`);

        // Store socket reference
        userSockets.set(userId, socket);

        // Join appropriate rooms based on role and committee
        joinAppropriateRooms(socket);

        // Send current state to newly connected user
        sendCurrentStateToUser(socket);

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            logger.info(`Socket disconnected: ${countryName || userId} (${reason})`);

            // Remove from user sockets map
            userSockets.delete(userId);

            // Remove from all room tracking
            for (const [roomName, users] of socketRooms.entries()) {
                users.delete(userId);
                if (users.size === 0) {
                    socketRooms.delete(roomName);
                }
            }
        });

        // Handle room joining requests
        socket.on('join-room', (roomName) => {
            joinSpecificRoom(socket, roomName);
        });

        // Handle leaving rooms
        socket.on('leave-room', (roomName) => {
            leaveSpecificRoom(socket, roomName);
        });

        // Handle ping for connection keepalive
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });

        // Heartbeat to detect broken connections
        socket.isAlive = true;
        socket.on('pong', () => {
            socket.isAlive = true;
        });
    });

    // Set up heartbeat interval
    setInterval(() => {
        io.sockets.sockets.forEach((socket) => {
            if (socket.isAlive === false) {
                logger.warn(`Terminating dead socket: ${socket.countryName || socket.userId}`);
                return socket.terminate();
            }

            socket.isAlive = false;
            socket.ping();
        });
    }, 30000); // 30 seconds

    return io;
};

// Join appropriate rooms based on user role and committee
const joinAppropriateRooms = (socket) => {
    const {
        userId,
        userRole,
        committeeId,
        presidiumRole
    } = socket;

    if (!committeeId && userRole !== 'admin') {
        logger.warn(`User ${userId} has no committee ID`);
        return;
    }

    // Everyone joins their committee room (if they have one)
    if (committeeId) {
        joinRoom(socket, `committee-${committeeId}`);
    }

    // Role-specific rooms
    switch (userRole) {
        case 'admin':
            joinRoom(socket, 'admin-global');
            // Admins can join any committee room they specify
            break;

        case 'presidium':
            joinRoom(socket, `presidium-${committeeId}`);
            joinRoom(socket, `delegates-${committeeId}`); // Can observe delegate room
            break;

        case 'delegate':
            joinRoom(socket, `delegates-${committeeId}`);
            break;
    }

    logger.info(`Socket ${socket.id} joined appropriate rooms for role: ${userRole}`);
};

// Join a specific room and track membership
const joinRoom = (socket, roomName) => {
    socket.join(roomName);

    // Track room membership
    if (!socketRooms.has(roomName)) {
        socketRooms.set(roomName, new Set());
    }
    socketRooms.get(roomName).add(socket.userId);

    logger.debug(`User ${socket.userId} joined room: ${roomName}`);
};

// Join specific room (for dynamic room joining)
const joinSpecificRoom = (socket, roomName) => {
    // Validate room access based on user role and committee
    if (canAccessRoom(socket, roomName)) {
        joinRoom(socket, roomName);
        socket.emit('room-joined', { room: roomName, success: true });
    } else {
        logger.warn(`Access denied to room ${roomName} for user ${socket.userId}`);
        socket.emit('room-join-error', {
            room: roomName,
            error: 'Access denied to this room'
        });
    }
};

// Leave specific room
const leaveSpecificRoom = (socket, roomName) => {
    socket.leave(roomName);

    if (socketRooms.has(roomName)) {
        socketRooms.get(roomName).delete(socket.userId);
        if (socketRooms.get(roomName).size === 0) {
            socketRooms.delete(roomName);
        }
    }

    socket.emit('room-left', { room: roomName });
    logger.debug(`User ${socket.userId} left room: ${roomName}`);
};

// Check if user can access a specific room
const canAccessRoom = (socket, roomName) => {
    const { userRole, committeeId, userId } = socket;

    // Admin can access any room
    if (userRole === 'admin') {
        return true;
    }

    // Committee-specific rooms
    if (roomName.startsWith('committee-') || roomName.startsWith('session-')) {
        const roomCommitteeId = roomName.split('-')[1];
        return committeeId === roomCommitteeId;
    }

    // Presidium rooms
    if (roomName.startsWith('presidium-')) {
        const roomCommitteeId = roomName.split('-')[1];
        return userRole === 'presidium' && committeeId === roomCommitteeId;
    }

    // Delegate rooms
    if (roomName.startsWith('delegates-')) {
        const roomCommitteeId = roomName.split('-')[1];
        return (userRole === 'delegate' || userRole === 'presidium') && committeeId === roomCommitteeId;
    }

    // Voting rooms (only those with voting rights)
    if (roomName.startsWith('voting-')) {
        return userRole === 'admin' || userRole === 'presidium' ||
            (userRole === 'delegate' && socket.specialRole !== 'observer' && socket.specialRole !== 'special');
    }

    // Coalition rooms - check if user is member
    if (roomName.startsWith('coalition-')) {
        // This would require checking coalition membership - implement when coalitions are ready
        return false;
    }

    // Default deny
    return false;
};

// Send current state to newly connected user
const sendCurrentStateToUser = async (socket) => {
    try {
        // Send basic welcome message
        socket.emit('connection-established', {
            timestamp: new Date().toISOString(),
            userRole: socket.userRole,
            country: socket.countryName,
            committeeId: socket.committeeId
        });

        // TODO: Send current session state, timers, etc. when those modules are ready

    } catch (error) {
        logger.error('Error sending current state:', error);
    }
};

// Utility functions for emitting to specific rooms/users

// Emit to all users in a committee
const emitToCommittee = (io, committeeId, event, data) => {
    io.to(`committee-${committeeId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
    });

    logger.debug(`Emitted ${event} to committee ${committeeId}`);
};

// Emit to presidium of a committee
const emitToPresidium = (io, committeeId, event, data) => {
    io.to(`presidium-${committeeId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
    });

    logger.debug(`Emitted ${event} to presidium of committee ${committeeId}`);
};

// Emit to delegates of a committee
const emitToDelegates = (io, committeeId, event, data) => {
    io.to(`delegates-${committeeId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
    });

    logger.debug(`Emitted ${event} to delegates of committee ${committeeId}`);
};

// Emit to a specific user
const emitToUser = (io, userId, event, data) => {
    const socket = userSockets.get(userId);
    if (socket) {
        socket.emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
        logger.debug(`Emitted ${event} to user ${userId}`);
        return true;
    }
    return false;
};

// Emit to specific voting session
const emitToVoting = (io, votingId, event, data) => {
    io.to(`voting-${votingId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
    });

    logger.debug(`Emitted ${event} to voting ${votingId}`);
};

// Get online users in a committee
const getOnlineUsers = (committeeId) => {
    const roomName = `committee-${committeeId}`;
    return socketRooms.get(roomName) || new Set();
};

// Get room statistics
const getRoomStats = () => {
    const stats = {};
    for (const [roomName, users] of socketRooms.entries()) {
        stats[roomName] = users.size;
    }
    return stats;
};

module.exports = {
    initializeWebSocket,
    emitToCommittee,
    emitToPresidium,
    emitToDelegates,
    emitToUser,
    emitToVoting,
    getOnlineUsers,
    getRoomStats
};