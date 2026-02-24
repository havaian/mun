/**
 * MUN.UZ Email Templates
 *
 * Brand tokens (from tailwind.config.js):
 *   Primary:    #009edb  (mun-blue)
 *   Primary-600:#0284c7
 *   Primary-700:#0369a1
 *   Primary-50: #f0f9ff
 *   Primary-100:#e0f2fe
 *   Gray-50:    #f8fafc
 *   Gray-100:   #f1f5f9
 *   Gray-200:   #e2e8f0
 *   Gray-300:   #cbd5e1
 *   Gray-500:   #64748b
 *   Gray-700:   #334155
 *   Gray-800:   #1e293b
 *   Gray-900:   #0f172a
 *   Green:      #10b981
 *   Green-600:  #059669
 *   Green-50:   #ecfdf5
 *   Red:        #ef4444
 *   Yellow:     #f59e0b
 *   Yellow-100: #fef3c7
 *   Font:       Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
 *   Radius:     8px (matches rounded-xl)
 *   Background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)
 */

// =============================================
// DESIGN TOKENS
// =============================================

const brand = {
    primary: '#009edb',
    primary600: '#0284c7',
    primary700: '#0369a1',
    primary50: '#f0f9ff',
    primary100: '#e0f2fe',
    gray50: '#f8fafc',
    gray100: '#f1f5f9',
    gray200: '#e2e8f0',
    gray300: '#cbd5e1',
    gray500: '#64748b',
    gray700: '#334155',
    gray800: '#1e293b',
    gray900: '#0f172a',
    green: '#10b981',
    green600: '#059669',
    green50: '#ecfdf5',
    green100: '#d1fae5',
    red: '#ef4444',
    red600: '#dc2626',
    red50: '#fef2f2',
    yellow: '#f59e0b',
    yellow100: '#fef3c7',
    yellow800: '#92400e',
    yellow900: '#78350f',
    white: '#ffffff',
    font: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    radius: '8px',
    radiusSm: '6px',
};

// =============================================
// LAYOUT — shared wrapper for all emails
// =============================================

function layout(content, { preheader = '' } = {}) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>MUN.UZ</title>
<!--[if mso]>
<style>table,td,th{font-family:Arial,Helvetica,sans-serif!important}</style>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  /* Reset */
  body,table,td,p,a,li{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0;mso-table-rspace:0}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none}
  body{margin:0;padding:0;width:100%!important}
  a{color:${brand.primary};text-decoration:none}
  a:hover{text-decoration:underline}
  /* Dark mode support */
  @media(prefers-color-scheme:dark){
    .email-bg{background-color:#0f172a!important}
    .email-card{background-color:#1e293b!important}
    .email-text{color:#e2e8f0!important}
    .email-text-secondary{color:#94a3b8!important}
    .email-divider{border-color:#334155!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:linear-gradient(135deg,${brand.primary50} 0%,${brand.primary100} 100%);font-family:${brand.font};">
${preheader ? `<div style="display:none;font-size:1px;color:${brand.primary50};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preheader}${'&zwnj;&nbsp;'.repeat(30)}</div>` : ''}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background:linear-gradient(135deg,${brand.primary50} 0%,${brand.primary100} 100%)">
<tr><td align="center" style="padding:40px 16px 32px">

<!-- Logo -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td align="center" style="padding-bottom:24px">
<table role="presentation" cellpadding="0" cellspacing="0">
<tr>
<td style="background:${brand.primary};border-radius:12px;padding:10px 14px;vertical-align:middle">
<span style="font-size:20px;font-weight:800;color:${brand.white};letter-spacing:1px;font-family:${brand.font}">MUN.UZ</span>
</td>
</tr>
</table>
</td></tr>
</table>

<!-- Card -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card" style="max-width:560px;background:${brand.white};border-radius:12px;overflow:hidden;border:1px solid ${brand.gray200}">

<!-- Content -->
<tr><td style="padding:36px 32px 32px">
${content}
</td></tr>

<!-- Footer -->
<tr><td class="email-divider" style="border-top:1px solid ${brand.gray200};padding:20px 32px">
<p style="margin:0;font-size:12px;color:${brand.gray500};text-align:center;line-height:1.5;font-family:${brand.font}">
This is an automated message from <span style="color:${brand.primary};font-weight:600">MUN.UZ</span><br>
Please do not reply directly to this email.
</p>
</td></tr>

</table>

<!-- Bottom branding -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:20px 0;text-align:center">
<p style="margin:0;font-size:11px;color:${brand.gray500};font-family:${brand.font}">
Model United Nations Platform
</p>
</td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;
}

// =============================================
// COMPONENTS — reusable email building blocks
// =============================================

/**
 * Primary action button
 */
function button(text, href, color = brand.primary) {
    // Bulletproof button — works in Outlook, Gmail, Apple Mail
    return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0 8px">
<tr><td align="center">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:44px;v-text-anchor:middle;width:220px" arcsize="14%" strokecolor="${color}" fillcolor="${color}">
<center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold">${text}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${href}" target="_blank" style="display:inline-block;background:${color};color:${brand.white};font-family:${brand.font};font-size:14px;font-weight:600;padding:12px 32px;border-radius:${brand.radius};text-decoration:none;text-align:center;mso-hide:all">${text}</a>
<!--<![endif]-->
</td></tr>
</table>`;
}

/**
 * Info badge — label + value pair
 */
function infoBadge(label, value) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0">
<tr><td style="background:${brand.primary50};border-radius:${brand.radiusSm};padding:12px 16px;border-left:3px solid ${brand.primary}">
<span style="font-size:11px;font-weight:600;color:${brand.gray500};text-transform:uppercase;letter-spacing:0.5px;font-family:${brand.font}">${label}</span><br>
<span style="font-size:15px;font-weight:600;color:${brand.gray800};font-family:${brand.font}">${value}</span>
</td></tr>
</table>`;
}

/**
 * Warning/feedback callout box
 */
function callout(title, body, { bg = brand.yellow100, border = brand.yellow, titleColor = brand.yellow800, bodyColor = brand.yellow900 } = {}) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0">
<tr><td style="background:${bg};border-left:4px solid ${border};border-radius:0 ${brand.radiusSm} ${brand.radiusSm} 0;padding:14px 16px">
<span style="font-size:11px;font-weight:700;color:${titleColor};text-transform:uppercase;letter-spacing:0.5px;font-family:${brand.font}">${title}</span>
<p style="margin:6px 0 0;color:${bodyColor};font-size:14px;line-height:1.5;font-family:${brand.font}">${body}</p>
</td></tr>
</table>`;
}

/**
 * Status pill
 */
function statusPill(text, { bg = brand.primary100, color = brand.primary700 } = {}) {
    return `<span style="display:inline-block;background:${bg};color:${color};font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;font-family:${brand.font}">${text}</span>`;
}

/**
 * Heading — h2 equivalent
 */
function heading(text, color = brand.gray900) {
    return `<h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:${color};font-family:${brand.font};line-height:1.3">${text}</h2>`;
}

/**
 * Greeting line
 */
function greeting(name) {
    return `<p style="margin:0 0 16px;color:${brand.gray500};font-size:15px;font-family:${brand.font}">Hi ${name},</p>`;
}

/**
 * Body paragraph
 */
function paragraph(text) {
    return `<p style="margin:0 0 16px;color:${brand.gray700};font-size:15px;line-height:1.6;font-family:${brand.font}">${text}</p>`;
}

/**
 * Small muted text
 */
function muted(text) {
    return `<p style="margin:16px 0 0;font-size:13px;color:${brand.gray500};line-height:1.5;font-family:${brand.font}">${text}</p>`;
}

/**
 * Divider
 */
function divider() {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0"><tr><td style="border-top:1px solid ${brand.gray200}"></td></tr></table>`;
}

// =============================================
// APPLICATION LIFECYCLE TEMPLATES
// =============================================

function applicationSubmitted({ eventName, applicantName, appLink }) {
    return layout([
        heading('Application Received'),
        greeting(applicantName),
        paragraph(`Your application for <strong style="color:${brand.gray800}">${eventName}</strong> has been submitted successfully and is now under review.`),
        paragraph('We\'ll notify you by email when there are updates on your application status.'),
        infoBadge('Current Status', statusPill('Under Review')),
        button('View My Application', appLink),
        muted('If you did not submit this application, please contact the event organizers.'),
    ].join('\n'), { preheader: `Your application for ${eventName} has been received.` });
}

function applicationReturnedForRevision({ eventName, applicantName, comment, appLink }) {
    return layout([
        heading('Revision Requested'),
        greeting(applicantName),
        paragraph(`Your application for <strong style="color:${brand.gray800}">${eventName}</strong> has been returned with a request for revision. Please review the feedback below and update your application.`),
        callout('Reviewer Feedback', comment),
        button('Edit My Application', appLink),
    ].join('\n'), { preheader: `Action needed: your application for ${eventName} needs revision.` });
}

function applicationAccepted({ eventName, applicantName, committeeName, role, appLink }) {
    const roleLabel = (role || 'delegate').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return layout([
        heading('🎉 Congratulations!', brand.green600),
        greeting(applicantName),
        paragraph(`We are pleased to inform you that your application for <strong style="color:${brand.gray800}">${eventName}</strong> has been <strong style="color:${brand.green600}">accepted</strong>!`),
        infoBadge('Committee', committeeName || 'To be confirmed'),
        infoBadge('Role', roleLabel),
        button('View Details', appLink, brand.green),
    ].join('\n'), { preheader: `Great news! You've been accepted to ${eventName}.` });
}

function applicationRejected({ eventName, applicantName, appLink }) {
    return layout([
        heading('Application Update'),
        greeting(applicantName),
        paragraph(`Thank you for your interest in <strong style="color:${brand.gray800}">${eventName}</strong>.`),
        paragraph('After careful review, we regret to inform you that your application was not accepted at this time.'),
        paragraph('We encourage you to apply again for future events — your interest is appreciated.'),
        button('View Application', appLink),
    ].join('\n'), { preheader: `Update on your application for ${eventName}.` });
}

function paymentRequired({ eventName, applicantName, amount, currency, deadline, instructions, appLink }) {
    const deadlineStr = deadline
        ? new Date(deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    const parts = [
        heading('Payment Required'),
        greeting(applicantName),
        paragraph(`To finalize your participation in <strong style="color:${brand.gray800}">${eventName}</strong>, please complete the registration fee payment.`),
    ];

    if (amount) {
        parts.push(infoBadge('Amount Due', `${currency || 'USD'} ${amount}`));
    }
    if (deadlineStr) {
        parts.push(infoBadge('Payment Deadline', deadlineStr));
    }
    if (instructions) {
        parts.push(callout('Payment Instructions', instructions.replace(/\n/g, '<br>'), {
            bg: brand.green50,
            border: brand.green,
            titleColor: brand.green600,
            bodyColor: brand.gray700
        }));
    }

    parts.push(button('View Payment Details', appLink));
    parts.push(muted('Your spot is reserved until the deadline. Please complete payment on time to avoid losing your place.'));

    return layout(parts.join('\n'), { preheader: `Action needed: complete your payment for ${eventName}.` });
}

function paymentVerified({ eventName, applicantName, appLink }) {
    return layout([
        heading('✅ Welcome!', brand.green600),
        greeting(applicantName),
        paragraph(`Your payment for <strong style="color:${brand.gray800}">${eventName}</strong> has been verified. You are now a confirmed participant!`),
        infoBadge('Status', statusPill('Confirmed Participant', { bg: brand.green100, color: brand.green600 })),
        button('View Event Details', appLink, brand.green),
        muted('Stay tuned for further updates about the event schedule and preparations.'),
    ].join('\n'), { preheader: `Payment confirmed — welcome to ${eventName}!` });
}

function interviewScheduled({ eventName, applicantName, scheduledAt, appLink }) {
    const dateStr = scheduledAt
        ? new Date(scheduledAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
        : 'To be confirmed';

    return layout([
        heading('Interview Scheduled'),
        greeting(applicantName),
        paragraph(`Your interview for <strong style="color:${brand.gray800}">${eventName}</strong> has been scheduled.`),
        infoBadge('Date & Time', dateStr),
        button('View Details', appLink),
        muted('Please be available at the scheduled time. If you have any questions, contact the event organizers.'),
    ].join('\n'), { preheader: `Interview scheduled for ${eventName}: ${dateStr}` });
}

// =============================================
// AUTH TEMPLATES
// =============================================

function emailVerification({ name, verifyLink }) {
    return layout([
        heading('Verify Your Email'),
        greeting(name),
        paragraph('Welcome to <strong style="color:' + brand.primary + '">MUN.UZ</strong>! Please verify your email address to complete your registration.'),
        button('Verify Email', verifyLink),
        muted('This link expires in 24 hours. If you did not create an account, you can safely ignore this email.'),
    ].join('\n'), { preheader: 'Verify your email to complete registration on MUN.UZ.' });
}

function passwordReset({ name, resetLink }) {
    return layout([
        heading('Reset Your Password'),
        greeting(name),
        paragraph('You requested a password reset for your MUN.UZ account. Click the button below to set a new password.'),
        button('Reset Password', resetLink),
        muted('This link expires in 1 hour. If you did not request this, you can safely ignore this email.'),
    ].join('\n'), { preheader: 'Password reset link for your MUN.UZ account.' });
}

// =============================================
// EXPORTS
// =============================================

module.exports = {
    // Components (for custom emails in the future)
    layout,
    button,
    infoBadge,
    callout,
    statusPill,
    heading,
    greeting,
    paragraph,
    muted,
    divider,
    brand,

    // Application lifecycle
    applicationSubmitted,
    applicationReturnedForRevision,
    applicationAccepted,
    applicationRejected,
    paymentRequired,
    paymentVerified,
    interviewScheduled,

    // Auth
    emailVerification,
    passwordReset
};