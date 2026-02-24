const nodemailer = require('nodemailer');

let transporter = null;
let isConfigured = false;

/**
 * Initialize SMTP transporter from env vars.
 * If SMTP is not configured, emails are logged but not sent.
 *
 * Expected env vars:
 *   SMTP_HOST        — e.g. smtp.gmail.com
 *   SMTP_PORT        — e.g. 587
 *   SMTP_SECURE      — 'true' for port 465, 'false' for STARTTLS (default: false)
 *   SMTP_USER        — SMTP username / email
 *   SMTP_PASS        — SMTP password / app password
 *   SMTP_FROM_NAME   — Display name (default: 'MUN.UZ')
 *   SMTP_FROM_EMAIL  — From address (default: SMTP_USER)
 *   CLIENT_URL       — Frontend base URL for links in emails (e.g. https://mun.uz)
 */
function init() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        global.logger.warn('⚠️  SMTP not configured — emails will be logged only. Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable.');
        isConfigured = false;
        return;
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });

    transporter.verify()
        .then(() => {
            global.logger.info(`✅ SMTP connected: ${host}:${port}`);
            isConfigured = true;
        })
        .catch(err => {
            global.logger.error(`❌ SMTP connection failed: ${err.message}`);
            isConfigured = false;
        });
}

function getFrom() {
    const name = process.env.SMTP_FROM_NAME || 'MUN.UZ';
    const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    return `"${name}" <${email}>`;
}

function getClientUrl() {
    return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
}

/**
 * Send an email. Fire-and-forget safe — never throws.
 */
async function send({ to, subject, html, text }) {
    try {
        if (!isConfigured || !transporter) {
            global.logger.info(`📧 [EMAIL-LOG] To: ${to} | Subject: ${subject}`);
            return { logged: true };
        }

        const info = await transporter.sendMail({
            from: getFrom(),
            to,
            subject,
            html,
            text: text || stripHtml(html)
        });

        global.logger.info(`📧 Email sent to ${to}: ${info.messageId}`);
        return { sent: true, messageId: info.messageId };
    } catch (error) {
        global.logger.error(`📧 Email failed to ${to}: ${error.message}`);
        return { error: error.message };
    }
}

function stripHtml(html) {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

module.exports = {
    init,
    send,
    getClientUrl,
    getFrom
};