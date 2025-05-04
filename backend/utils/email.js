const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Send an email using Nodemailer
 * @param {Object} options - Email options (to, subject, text, html)
 */
const sendEmail = async (options) => {
    try {
        const hasCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;

        // If no credentials, we just log to console and return
        if (!hasCredentials) {
            console.log('\n=========================================');
            console.log('📬  EMAIL SIMULATION MODE (No SMTP credentials found)');
            console.log(`To:      ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Code:    ${options.text.match(/\d{6}/) ? options.text.match(/\d{6}/)[0] : 'No code found'}`);
            console.log('-----------------------------------------');
            console.log('Action Required: Please add SMTP_USER and SMTP_PASS to backend/.env to send real emails.');
            console.log('=========================================\n');
            return { success: true, message: 'Email logged to console (Simulation mode)' };
        }

        // Create a transporter for real email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'HealthQueue'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error(`Email error: ${error.message}`);
        // Fallback to console in development even if it failed
        if (process.env.NODE_ENV === 'development') {
            console.log('\n❌ Real email failed, falling back to console log:');
            console.log(`Code: ${options.text.match(/\d{6}/) ? options.text.match(/\d{6}/)[0] : 'N/A'}\n`);
            return { success: true, simulated: true };
        }
        throw error;
    }
};

module.exports = sendEmail;
