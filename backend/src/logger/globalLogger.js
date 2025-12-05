// backend/src/logger/globalLogger.js
const logger = require('./logger');

/**
 * Setup global logger
 * Call this early in startup (in app.js or server.js)
 */
const setupGlobalLogger = () => {
    // Create global logger reference
    global.logger = logger;

    // Add helpful convenience shortcuts if you want
    global.log = {
        info: logger.info.bind(logger),
        warn: logger.warn.bind(logger),
        error: logger.error.bind(logger),
        debug: logger.debug?.bind(logger),
        stream: logger.stream, // for morgan
    };

    logger.info('Global logger initialized');

    return global.logger;
};

module.exports = {
    setupGlobalLogger,
    logger, // also export directly for flexibility
};
