const { Timer } = require('./model');
const { Committee } = require('../committee/model');
const Session = require('../session/model');
const { emitToRoom } = require('../websocket/socketManager');

// Active timer intervals storage
const timerIntervals = new Map();

// Create new timer
const createTimer = async (req, res) => {
    try {
        const {
            committeeId,
            sessionId,
            timerType,
            name,
            description,
            totalDuration,
            countDown = true,
            autoStart = false,
            warningTimes = [30, 10],
            controllableBy = ['presidium'],
            priority = 0,
            associatedSpeaker,
            associatedMotion
        } = req.body;

        // Verify committee and session exist
        const committee = await Committee.findById(committeeId);
        if (!committee) {
            return res.status(404).json({ error: 'Committee not found' });
        }

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check if timer type already exists and is active
        const existingTimer = await Timer.findOne({
            committeeId,
            timerType,
            status: { $in: ['running', 'paused'] }
        });

        if (existingTimer) {
            return res.status(400).json({ 
                error: `Timer of type '${timerType}' is already active`,
                existingTimerId: existingTimer._id
            });
        }

        // Create timer
        const timer = new Timer({
            committeeId,
            sessionId,
            timerType,
            name: name.trim(),
            description: description?.trim(),
            totalDuration,
            remainingTime: countDown ? totalDuration : 0,
            countDown,
            warningTimes: warningTimes.sort((a, b) => b - a), // Sort descending
            controllableBy,
            priority,
            associatedSpeaker,
            associatedMotion,
            createdBy: req.user.userId
        });

        timer.events.push({
            eventType: 'created',
            triggeredBy: req.user.userId,
            details: { 
                timerType,
                totalDuration,
                countDown,
                autoStart
            }
        });

        await timer.save();

        // Auto-start if requested
        if (autoStart) {
            timer.start(req.user.userId);
            await timer.save();
            startTimerInterval(timer);
        }

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${committeeId}`, 'timer-created', {
                timerId: timer._id,
                timerType: timer.timerType,
                name: timer.name,
                totalDuration: timer.totalDuration,
                isActive: timer.isActive,
                autoStarted: autoStart
            });
        }

        global.logger.info(`Timer created: "${name}" (${timerType}) for committee ${committeeId} by ${req.user.email}`);

        res.status(201).json({
            success: true,
            timer: formatTimerResponse(timer),
            message: `Timer created successfully${autoStart ? ' and started' : ''}`
        });

    } catch (error) {
        global.logger.error('Create timer error:', error);
        res.status(500).json({ error: 'Failed to create timer' });
    }
};

// Pause timer
const pauseTimer = async (req, res) => {
    try {
        const { id } = req.params;

        const timer = await Timer.findById(id);
        if (!timer) {
            return res.status(404).json({ error: 'Timer not found' });
        }

        if (!timer.isActive || timer.isPaused) {
            return res.status(400).json({ error: 'Timer is not running' });
        }

        // Check user permissions
        if (!timer.canBeControlledBy(req.user.role)) {
            return res.status(403).json({ error: 'You do not have permission to control this timer' });
        }

        timer.pause(req.user.userId);
        await timer.save();

        // Stop interval
        stopTimerInterval(timer._id);

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${timer.committeeId}`, 'timer-paused', {
                timerId: timer._id,
                timerType: timer.timerType,
                name: timer.name,
                pausedAt: timer.pausedAt,
                pausedBy: req.user.countryName || req.user.username,
                remainingTime: timer.remainingTime
            });
        }

        global.logger.info(`Timer paused: ${timer.name} (${timer._id}) by ${req.user.email}`);

        res.json({
            success: true,
            timer: formatTimerResponse(timer),
            message: 'Timer paused successfully'
        });

    } catch (error) {
        global.logger.error('Pause timer error:', error);
        res.status(500).json({ error: error.message || 'Failed to pause timer' });
    }
}

// Start timer
const startTimer = async (req, res) => {
    try {
        const { id } = req.params;

        const timer = await Timer.findById(id);
        if (!timer) {
            return res.status(404).json({ error: 'Timer not found' });
        }

        if (timer.isActive) {
            return res.status(400).json({ error: 'Timer is already active' });
        }

        // Check user permissions
        if (!timer.canBeControlledBy(req.user.role)) {
            return res.status(403).json({ error: 'You do not have permission to control this timer' });
        }

        timer.pause(req.user.userId);
        await timer.save();

        // Stop interval
        stopTimerInterval(timer._id);

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${timer.committeeId}`, 'timer-paused', {
                timerId: timer._id,
                timerType: timer.timerType,
                name: timer.name,
                pausedAt: timer.pausedAt,
                pausedBy: req.user.countryName || req.user.username,
                remainingTime: timer.remainingTime
            });
        }

        global.logger.info(`Timer paused: ${timer.name} (${timer._id}) by ${req.user.email}`);

        res.json({
            success: true,
            timer: formatTimerResponse(timer),
            message: 'Timer paused successfully'
        });

    } catch (error) {
        global.logger.error('Pause timer error:', error);
        res.status(500).json({ error: error.message || 'Failed to pause timer' });
    }
};

// Resume timer
const resumeTimer = async (req, res) => {
    try {
        const { id } = req.params;

        const timer = await Timer.findById(id);
        if (!timer) {
            return res.status(404).json({ error: 'Timer not found' });
        }

        if (!timer.isActive || !timer.isPaused) {
            return res.status(400).json({ error: 'Timer is not paused' });
        }

        // Check user permissions
        if (!timer.canBeControlledBy(req.user.role)) {
            return res.status(403).json({ error: 'You do not have permission to control this timer' });
        }

        timer.resume(req.user.userId);
        await timer.save();

        // Restart interval
        startTimerInterval(timer);

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${timer.committeeId}`, 'timer-resumed', {
                timerId: timer._id,
                timerType: timer.timerType,
                name: timer.name,
                resumedBy: req.user.countryName || req.user.username,
                remainingTime: timer.remainingTime
            });
        }

        global.logger.info(`Timer resumed: ${timer.name} (${timer._id}) by ${req.user.email}`);

        res.json({
            success: true,
            timer: formatTimerResponse(timer),
            message: 'Timer resumed successfully'
        });

    } catch (error) {
        global.logger.error('Resume timer error:', error);
        res.status(500).json({ error: error.message || 'Failed to resume timer' });
    }
};

// Extend timer
const extendTimer = async (req, res) => {
    try {
        const { id } = req.params;
        const { additionalSeconds, reason } = req.body;

        const timer = await Timer.findById(id);
        if (!timer) {
            return res.status(404).json({ error: 'Timer not found' });
        }

        // Check user permissions (usually only presidium can extend)
        if (req.user.role !== 'presidium') {
            return res.status(403).json({ error: 'Only presidium can extend timers' });
        }

        timer.extend(additionalSeconds, reason, req.user.userId);
        await timer.save();

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${timer.committeeId}`, 'timer-extended', {
                timerId: timer._id,
                timerType: timer.timerType,
                name: timer.name,
                addedTime: additionalSeconds,
                newTotalDuration: timer.totalDuration,
                reason,
                extendedBy: req.user.countryName || req.user.username
            });
        }

        global.logger.info(`Timer extended: ${timer.name} (${timer._id}) by ${additionalSeconds}s by ${req.user.email}. Reason: ${reason}`);

        res.json({
            success: true,
            timer: formatTimerResponse(timer),
            message: `Timer extended by ${Math.floor(additionalSeconds / 60)}:${(additionalSeconds % 60).toString().padStart(2, '0')}`
        });

    } catch (error) {
        global.logger.error('Extend timer error:', error);
        res.status(500).json({ error: error.message || 'Failed to extend timer' });
    }
};

// Complete timer
const completeTimer = async (req, res) => {
    try {
        const { id } = req.params;

        const timer = await Timer.findById(id);
        if (!timer) {
            return res.status(404).json({ error: 'Timer not found' });
        }

        // Check user permissions
        if (!timer.canBeControlledBy(req.user.role)) {
            return res.status(403).json({ error: 'You do not have permission to control this timer' });
        }

        timer.complete(req.user.userId);
        await timer.save();

        // Stop interval
        stopTimerInterval(timer._id);

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${timer.committeeId}`, 'timer-completed', {
                timerId: timer._id,
                timerType: timer.timerType,
                name: timer.name,
                completedAt: timer.completedAt,
                completedBy: req.user.countryName || req.user.username
            });
        }

        global.logger.info(`Timer completed: ${timer.name} (${timer._id}) by ${req.user.email}`);

        res.json({
            success: true,
            timer: formatTimerResponse(timer),
            message: 'Timer completed successfully'
        });

    } catch (error) {
        global.logger.error('Complete timer error:', error);
        res.status(500).json({ error: error.message || 'Failed to complete timer' });
    }
};

// Cancel timer
const cancelTimer = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const timer = await Timer.findById(id);
        if (!timer) {
            return res.status(404).json({ error: 'Timer not found' });
        }

        // Check user permissions (usually only presidium can cancel)
        if (req.user.role !== 'presidium') {
            return res.status(403).json({ error: 'Only presidium can cancel timers' });
        }

        timer.cancel(reason, req.user.userId);
        await timer.save();

        // Stop interval
        stopTimerInterval(timer._id);

        // Emit to committee room
        if (req.app.locals.io) {
            emitToRoom(req.app.locals.io, `committee-${timer.committeeId}`, 'timer-cancelled', {
                timerId: timer._id,
                timerType: timer.timerType,
                name: timer.name,
                reason,
                cancelledBy: req.user.countryName || req.user.username
            });
        }

        global.logger.info(`Timer cancelled: ${timer.name} (${timer._id}) by ${req.user.email}. Reason: ${reason}`);

        res.json({
            success: true,
            message: 'Timer cancelled successfully'
        });

    } catch (error) {
        global.logger.error('Cancel timer error:', error);
        res.status(500).json({ error: error.message || 'Failed to cancel timer' });
    }
};

// Get timer details
const getTimer = async (req, res) => {
    try {
        const { id } = req.params;

        const timer = await Timer.findById(id)
            .populate('createdBy', 'username countryName');

        if (!timer) {
            return res.status(404).json({ error: 'Timer not found' });
        }

        res.json({
            success: true,
            timer: formatTimerResponse(timer, true) // Include full details
        });

    } catch (error) {
        global.logger.error('Get timer error:', error);
        res.status(500).json({ error: 'Failed to get timer details' });
    }
};

// Get committee timers
const getCommitteeTimers = async (req, res) => {
    try {
        const { committeeId } = req.params;
        const { 
            status = 'all',
            timerType = 'all',
            includeCompleted = false
        } = req.query;

        const filter = { committeeId };

        if (status !== 'all') {
            filter.status = status;
        }

        if (timerType !== 'all') {
            filter.timerType = timerType;
        }

        if (!includeCompleted) {
            filter.status = { $nin: ['completed', 'expired', 'cancelled'] };
        }

        const timers = await Timer.find(filter)
            .populate('createdBy', 'username countryName')
            .sort({ priority: -1, createdAt: -1 });

        const timersData = timers.map(timer => formatTimerResponse(timer));

        res.json({
            success: true,
            timers: timersData,
            totalActive: timers.filter(t => t.isActive).length,
            totalTimers: timers.length
        });

    } catch (error) {
        global.logger.error('Get committee timers error:', error);
        res.status(500).json({ error: 'Failed to get committee timers' });
    }
};

// Get active timers for session
const getActiveTimers = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const timers = await Timer.find({
            sessionId,
            status: { $in: ['running', 'paused'] }
        })
        .populate('createdBy', 'username countryName')
        .sort({ priority: -1, timerType: 1 });

        const timersData = timers.map(timer => {
            timer.updateRemainingTime();
            return formatTimerResponse(timer);
        });

        res.json({
            success: true,
            timers: timersData,
            count: timersData.length
        });

    } catch (error) {
        global.logger.error('Get active timers error:', error);
        res.status(500).json({ error: 'Failed to get active timers' });
    }
};

// Helper function to format timer response
const formatTimerResponse = (timer, includeFullDetails = false) => {
    timer.updateRemainingTime();
    
    const response = {
        _id: timer._id,
        timerType: timer.timerType,
        name: timer.name,
        description: timer.description,
        totalDuration: timer.totalDuration,
        remainingTime: timer.remainingTime,
        displayTime: timer.getDisplayTime(),
        isActive: timer.isActive,
        isPaused: timer.isPaused,
        status: timer.status,
        countDown: timer.countDown,
        priority: timer.priority,
        progressPercentage: timer.progressPercentage,
        startedAt: timer.startedAt,
        controllableBy: timer.controllableBy,
        associatedSpeaker: timer.associatedSpeaker
    };

    if (includeFullDetails) {
        response.pauseHistory = timer.pauseHistory;
        response.extensions = timer.extensions;
        response.events = timer.events;
        response.warningTimes = timer.warningTimes;
        response.createdBy = timer.createdBy;
        response.createdAt = timer.createdAt;
        response.runtime = timer.runtime;
        response.totalPausedTime = timer.totalPausedTime;
    }

    return response;
};

// Timer interval management
const startTimerInterval = (timer) => {
    // Clear existing interval if any
    stopTimerInterval(timer._id);

    const interval = setInterval(async () => {
        try {
            const currentTimer = await Timer.findById(timer._id);
            if (!currentTimer || !currentTimer.isActive || currentTimer.isPaused) {
                stopTimerInterval(timer._id);
                return;
            }

            const previousTime = currentTimer.remainingTime;
            currentTimer.updateRemainingTime();

            // Check for warnings
            const warnings = currentTimer.checkWarnings();
            if (warnings.length > 0) {
                // Emit warning
                const io = require('../websocket/socketManager').getIO();
                if (io) {
                    emitToRoom(io, `committee-${currentTimer.committeeId}`, 'timer-warning', {
                        timerId: currentTimer._id,
                        timerType: currentTimer.timerType,
                        name: currentTimer.name,
                        remainingTime: currentTimer.remainingTime,
                        warningTimes: warnings
                    });
                }

                // Log warning event
                currentTimer.events.push({
                    eventType: 'warning',
                    details: { warningTimes: warnings, remainingTime: currentTimer.remainingTime }
                });
            }

            // Check if timer expired
            if (currentTimer.status === 'expired') {
                stopTimerInterval(timer._id);
                
                const io = require('../websocket/socketManager').getIO();
                if (io) {
                    emitToRoom(io, `committee-${currentTimer.committeeId}`, 'timer-expired', {
                        timerId: currentTimer._id,
                        timerType: currentTimer.timerType,
                        name: currentTimer.name
                    });
                }

                global.logger.info(`Timer expired: ${currentTimer.name} (${currentTimer._id})`);
            }

            // Save if there were changes
            if (warnings.length > 0 || currentTimer.status === 'expired') {
                await currentTimer.save();
            }

            // Emit regular update (every 5 seconds to reduce load)
            if (Math.floor(Date.now() / 1000) % 5 === 0) {
                const io = require('../websocket/socketManager').getIO();
                if (io) {
                    emitToRoom(io, `committee-${currentTimer.committeeId}`, 'timer-update', {
                        timerId: currentTimer._id,
                        remainingTime: currentTimer.remainingTime,
                        displayTime: currentTimer.getDisplayTime(),
                        progressPercentage: currentTimer.progressPercentage
                    });
                }
            }

        } catch (error) {
            global.logger.error('Timer interval error:', error);
            stopTimerInterval(timer._id);
        }
    }, 1000); // Update every second

    timerIntervals.set(timer._id.toString(), interval);
};

const stopTimerInterval = (timerId) => {
    const interval = timerIntervals.get(timerId.toString());
    if (interval) {
        clearInterval(interval);
        timerIntervals.delete(timerId.toString());
    }
};

// Initialize active timers on server start
const initializeActiveTimers = async () => {
    try {
        const activeTimers = await Timer.find({
            status: 'running'
        });

        for (const timer of activeTimers) {
            startTimerInterval(timer);
        }

        global.logger.info(`Initialized ${activeTimers.length} active timers`);
    } catch (error) {
        global.logger.error('Failed to initialize active timers:', error);
    }
};

module.exports = {
    createTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    extendTimer,
    completeTimer,
    cancelTimer,
    getTimer,
    getCommitteeTimers,
    getActiveTimers,
    initializeActiveTimers,
    startTimerInterval,
    stopTimerInterval
};