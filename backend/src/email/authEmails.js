/**
 * Auth email hooks.
 * Fire-and-forget — never throw.
 */

const emailService = require('./service');
const templates = require('./templates');

/**
 * Send email verification link after registration
 * @param {Object} user — user document with email, firstName, verificationToken
 */
async function sendVerificationEmail(user) {
    try {
        if (!user?.email || !user?.verificationToken) return;

        const base = emailService.getClientUrl();
        const verifyLink = `${base}/verify-email?token=${user.verificationToken}`;

        await emailService.send({
            to: user.email,
            subject: 'Verify your email — MUN.UZ',
            html: templates.emailVerification({
                name: user.firstName || user.email.split('@')[0],
                verifyLink
            })
        });
    } catch (e) {
        global.logger.error('sendVerificationEmail failed:', e.message);
    }
}

/**
 * Send password reset link
 * @param {Object} user — user document with email, firstName, resetPasswordToken
 */
async function sendPasswordResetEmail(user) {
    try {
        if (!user?.email || !user?.resetPasswordToken) return;

        const base = emailService.getClientUrl();
        const resetLink = `${base}/reset-password?token=${user.resetPasswordToken}`;

        await emailService.send({
            to: user.email,
            subject: 'Reset your password — MUN.UZ',
            html: templates.passwordReset({
                name: user.firstName || user.email.split('@')[0],
                resetLink
            })
        });
    } catch (e) {
        global.logger.error('sendPasswordResetEmail failed:', e.message);
    }
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};