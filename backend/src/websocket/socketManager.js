const jwt = require('jsonwebtoken');
const { User } = require('../auth/model');

// Store active connections
const activeConnections = new Map(); // userId -> Set of socket IDs
const socketUsers = new Map(); // socketId -> userId
const userRooms = new Map(); // userId -> Set of room names
let io = null;

// Initialize WebSocket server
const initializeWebSocket = (socketIO) => {
    io = socketIO;

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = {
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
                countryName: user.countryName,
                committeeId: user.committeeId?.toString(),
                presidiumRole: user.presidiumRole
            };

            next();
        } catch (error) {
            global.logger.error('WebSocket authentication error:', error);
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        handleConnection(socket);
    });

    global.logger.info('WebSocket server initialized');
};

// Handle new socket connection
const handleConnection = (socket) => {
    const userId = socket.userId;
    const user = socket.user;

    global.logger.info(`User connected: ${user.email} (${socket.id})`);

    // Track connection
    if (!activeConnections.has(userId)) {
        activeConnections.set(userId, new Set());
    }
    activeConnections.get(userId).add(socket.id);
    socketUsers.set(socket.id, userId);

    // Join appropriate rooms based on user role and committee
    joinUserRooms(socket, user);

    // Send connection confirmation
    socket.emit('connected', {
        message: 'Connected to MUN platform',
        user: {
            email: user.email,
            role: user.role,
            countryName: user.countryName,
            committeeId: user.committeeId
        },
        timestamp: new Date()
    });

    // Handle custom events
    setupEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        handleDisconnection(socket, reason);
    });
};

// Join user to appropriate rooms
const joinUserRooms = (socket, user) => {
    const rooms = new Set();

    if (user.committeeId) {
        // Join committee room
        const committeeRoom = `committee-${user.committeeId}`;
        socket.join(committeeRoom);
        rooms.add(committeeRoom);

        // Join role-specific rooms
        if (user.role === 'presidium') {
            const presidiumRoom = `presidium-${user.committeeId}`;
            socket.join(presidiumRoom);
            rooms.add(presidiumRoom);
        } else if (user.role === 'delegate') {
            const delegatesRoom = `delegates-${user.committeeId}`;
            socket.join(delegatesRoom);
            rooms.add(delegatesRoom);
        }

        // Join presentation room (public display)
        const presentationRoom = `presentation-${user.committeeId}`;
        socket.join(presentationRoom);
        rooms.add(presentationRoom);
    }

    // Join admin room if admin
    if (user.role === 'admin') {
        socket.join('admins');
        rooms.add('admins');
    }

    // Store user rooms
    userRooms.set(socket.userId, rooms);

    global.logger.debug(`User ${user.email} joined rooms: ${Array.from(rooms).join(', ')}`);
};

// Setup event handlers for socket
const setupEventHandlers = (socket) => {
    const user = socket.user;

    // Join/leave specific rooms
    socket.on('join-room', (data) => {
        const { roomName, password } = data;

        // Validate room access
        if (canJoinRoom(user, roomName, password)) {
            socket.join(roomName);

            if (!userRooms.has(socket.userId)) {
                userRooms.set(socket.userId, new Set());
            }
            userRooms.get(socket.userId).add(roomName);

            socket.emit('room-joined', { roomName });
            global.logger.debug(`User ${user.email} joined room: ${roomName}`);
        } else {
            socket.emit('room-join-failed', {
                roomName,
                error: 'Access denied to room'
            });
        }
    });

    socket.on('leave-room', (data) => {
        const { roomName } = data;
        socket.leave(roomName);

        if (userRooms.has(socket.userId)) {
            userRooms.get(socket.userId).delete(roomName);
        }

        socket.emit('room-left', { roomName });
        global.logger.debug(`User ${user.email} left room: ${roomName}`);
    });

    // Voting-related events
    socket.on('join-voting', (data) => {
        const { votingId } = data;
        const votingRoom = `voting-${votingId}`;

        // Validate voting access
        if (user.role === 'delegate' || user.role === 'presidium') {
            socket.join(votingRoom);
            socket.emit('voting-joined', { votingId });
        }
    });

    // Coalition-related events
    socket.on('join-coalition', (data) => {
        const { coalitionId } = data;
        const coalitionRoom = `coalition-${coalitionId}`;

        // Validate coalition membership
        // This would need to check if user is part of the coalition
        socket.join(coalitionRoom);
        socket.emit('coalition-joined', { coalitionId });
    });

    // Session-related events
    socket.on('join-session', (data) => {
        const { sessionId } = data;
        const sessionRoom = `session-${sessionId}`;

        if (user.committeeId) {
            socket.join(sessionRoom);
            socket.emit('session-joined', { sessionId });
        }
    });

    // Heartbeat for connection monitoring
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
    });

    // User status updates
    socket.on('update-status', (data) => {
        const { status } = data;

        // Broadcast status to committee
        if (user.committeeId) {
            socket.to(`committee-${user.committeeId}`).emit('user-status-changed', {
                userId: user.userId,
                email: user.email,
                countryName: user.countryName,
                status,
                timestamp: new Date()
            });
        }
    });

    // Error handling
    socket.on('error', (error) => {
        global.logger.error(`Socket error for user ${user.email}:`, error);
    });
};

// Handle socket disconnection
const handleDisconnection = (socket, reason) => {
    const userId = socket.userId;
    const user = socket.user;

    global.logger.info(`User disconnected: ${user.email} (${socket.id}) - ${reason}`);

    // Remove from tracking
    if (activeConnections.has(userId)) {
        activeConnections.get(userId).delete(socket.id);
        if (activeConnections.get(userId).size === 0) {
            activeConnections.delete(userId);
        }
    }

    socketUsers.delete(socket.id);

    // If user has no more connections, remove from room tracking
    if (!activeConnections.has(userId)) {
        userRooms.delete(userId);

        // Notify committee about user going offline
        if (user.committeeId) {
            socket.to(`committee-${user.committeeId}`).emit('user-offline', {
                userId: user.userId,
                email: user.email,
                countryName: user.countryName,
                timestamp: new Date()
            });
        }
    }
};

// Utility function to check room access
const canJoinRoom = (user, roomName, password) => {
    // Basic room access validation

    // Committee rooms
    if (roomName.startsWith('committee-')) {
        const committeeId = roomName.replace('committee-', '');
        return user.committeeId === committeeId;
    }

    // Presidium rooms
    if (roomName.startsWith('presidium-')) {
        const committeeId = roomName.replace('presidium-', '');
        return user.role === 'presidium' && user.committeeId === committeeId;
    }

    // Delegate rooms
    if (roomName.startsWith('delegates-')) {
        const committeeId = roomName.replace('delegates-', '');
        return user.role === 'delegate' && user.committeeId === committeeId;
    }

    // Admin rooms
    if (roomName === 'admins') {
        return user.role === 'admin';
    }

    // Voting rooms (validated separately in voting controller)
    if (roomName.startsWith('voting-')) {
        return user.role === 'delegate' || user.role === 'presidium';
    }

    // Coalition rooms (would need coalition membership check)
    if (roomName.startsWith('coalition-')) {
        return user.role === 'delegate';
    }

    return false;
};

// Emit to specific user (all their connections)
const emitToUser = (io, userEmail, event, data) => {
    // Find user ID by email (could be optimized with a reverse lookup map)
    for (const [socketId, userId] of socketUsers.entries()) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket && socket.user.email === userEmail) {
            socket.emit(event, data);
        }
    }
};

// Emit to room
const emitToRoom = (io, roomName, event, data) => {
    io.to(roomName).emit(event, data);
};

// Emit to committee
const emitToCommittee = (io, committeeId, event, data) => {
    emitToRoom(io, `committee-${committeeId}`, event, data);
};

// Emit to presidium
const emitToPresidium = (io, committeeId, event, data) => {
    emitToRoom(io, `presidium-${committeeId}`, event, data);
};

// Emit to delegates
const emitToDelegates = (io, committeeId, event, data) => {
    emitToRoom(io, `delegates-${committeeId}`, event, data);
};

// Get online users for committee
const getOnlineUsers = (committeeId) => {
    const onlineUsers = [];

    for (const [socketId, userId] of socketUsers.entries()) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket && socket.user.committeeId === committeeId) {
            onlineUsers.push({
                userId: socket.user.userId,
                email: socket.user.email,
                countryName: socket.user.countryName,
                role: socket.user.role,
                connectedAt: new Date() // Could track actual connection time
            });
        }
    }

    return onlineUsers;
};

// Get connection count for committee
const getCommitteeConnectionCount = (committeeId) => {
    let count = 0;

    for (const [socketId, userId] of socketUsers.entries()) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket && socket.user.committeeId === committeeId) {
            count++;
        }
    }

    return count;
};

// Broadcast system message
const broadcastSystemMessage = (message, level = 'info') => {
    io.emit('system-message', {
        message,
        level,
        timestamp: new Date()
    });

    global.logger.info(`System broadcast: ${message}`);
};

// Get IO instance for external use
const getIO = () => io;

// Cleanup function for graceful shutdown
const cleanup = () => {
    if (io) {
        io.close();
        activeConnections.clear();
        socketUsers.clear();
        userRooms.clear();
        global.logger.info('WebSocket server closed');
    }
};

module.exports = {
    initializeWebSocket,
    emitToUser,
    emitToRoom,
    emitToCommittee,
    emitToPresidium,
    emitToDelegates,
    getOnlineUsers,
    getCommitteeConnectionCount,
    broadcastSystemMessage,
    getIO,
    cleanup
};