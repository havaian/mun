const { Notification } = require('./model');

// Get notifications for the current user
const getMyNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;

        const filter = { recipient: req.user.userId };
        if (unreadOnly === 'true') filter.read = false;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ recipient: req.user.userId, read: false })
        ]);

        res.json({
            success: true,
            notifications,
            unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        global.logger.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Mark a single notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: req.user.userId },
            { read: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ success: true, notification });
    } catch (error) {
        global.logger.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { recipient: req.user.userId, read: false },
            { read: true, readAt: new Date() }
        );

        res.json({
            success: true,
            markedCount: result.modifiedCount,
            message: `${result.modifiedCount} notification(s) marked as read`
        });
    } catch (error) {
        global.logger.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

// Get unread count only (lightweight endpoint for badge display)
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.userId,
            read: false
        });

        res.json({ success: true, unreadCount: count });
    } catch (error) {
        global.logger.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};