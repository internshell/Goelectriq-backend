import nodemailer from 'nodemailer';

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send email
 */
export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = () => {
  try {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
      console.warn('⚠️  Email not configured. Outgoing emails will not be sent.');
      return false;
    }
    const transporter = createTransporter();
    transporter.verify((err) => {
      if (err) {
        console.warn('⚠️  Email server verification failed:', err.message);
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });
    return true;
  } catch (error) {
    console.warn('⚠️  Email configuration error:', error.message);
    return false;
  }
};

export default { sendEmail, verifyEmailConfig };  