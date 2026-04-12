import axios from 'axios';

/**
 * WhatsApp Cloud API Configuration
 */
const whatsappConfig = {
  apiUrl: process.env.WHATSAPP_API_URL ? process.env.WHATSAPP_API_URL.replace(/\/$/, '') : null,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
};

/**
 * Validate WhatsApp configuration
 */
const validateWhatsAppConfig = () => {
  const missing = [];
  if (!whatsappConfig.apiUrl) missing.push('WHATSAPP_API_URL');
  if (!whatsappConfig.phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!whatsappConfig.accessToken) missing.push('WHATSAPP_ACCESS_TOKEN');
  
  if (missing.length > 0) {
    console.warn(`⚠️ WhatsApp configuration incomplete. Missing: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

/**
 * Send WhatsApp message using Meta Cloud API
 */
export const sendWhatsAppMessage = async (to, message) => {
  try {
    // Validate configuration - if missing, just warn and return gracefully
    if (!validateWhatsAppConfig()) {
      console.info('ℹ️ WhatsApp not configured - skipping message to', to);
      return { success: false, reason: 'WhatsApp not configured' };
    }

    // Remove +91 prefix if present and ensure 10 digit number
    const phoneNumber = to.replace(/^\+91/, '').replace(/\D/g, '');
    
    // Add country code for India
    const formattedNumber = `91${phoneNumber}`;

    const url = `${whatsappConfig.apiUrl}/${whatsappConfig.phoneNumberId}/messages`;

    const data = {
      messaging_product: 'whatsapp',
      to: formattedNumber,
      type: 'text',
      text: {
        body: message,
      },
    };

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ WhatsApp message sent to ${formattedNumber}`);
    return response.data;
  } catch (error) {
    // Log error but don't throw - allow booking to proceed
    console.error('❌ WhatsApp sending error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send WhatsApp template message
 */
export const sendWhatsAppTemplate = async (to, templateName, parameters) => {
  try {
    // Validate configuration - if missing, just warn and return gracefully
    if (!validateWhatsAppConfig()) {
      console.info('ℹ️ WhatsApp not configured - skipping template message to', to);
      return { success: false, reason: 'WhatsApp not configured' };
    }

    const phoneNumber = to.replace(/^\+91/, '').replace(/\D/g, '');
    const formattedNumber = `91${phoneNumber}`;

    const url = `${whatsappConfig.apiUrl}/${whatsappConfig.phoneNumberId}/messages`;

    const data = {
      messaging_product: 'whatsapp',
      to: formattedNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en',
        },
        components: [
          {
            type: 'body',
            parameters: parameters.map(param => ({
              type: 'text',
              text: param,
            })),
          },
        ],
      },
    };

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ WhatsApp template sent to ${formattedNumber}`);
    return response.data;
  } catch (error) {
    // Log error but don't throw - allow booking to proceed
    console.error('❌ WhatsApp template error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Alternative: Send WhatsApp using Twilio
 */
export const sendWhatsAppViaTwilio = async (to, message) => {
  try {
    // This is for Twilio WhatsApp API (alternative implementation)
    // Uncomment and use if you prefer Twilio over Meta Cloud API
    
    // const accountSid = process.env.TWILIO_ACCOUNT_SID;
    // const authToken = process.env.TWILIO_AUTH_TOKEN;
    // const client = require('twilio')(accountSid, authToken);
    
    // const twilioMessage = await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_WHATSAPP_NUMBER,
    //   to: `whatsapp:+91${to}`,
    // });
    
    // console.log(`✅ WhatsApp sent via Twilio: ${twilioMessage.sid}`);
    // return twilioMessage;

    console.log('Twilio WhatsApp not configured. Using Meta Cloud API instead.');
    return null;
  } catch (error) {
    console.error('❌ Twilio WhatsApp error:', error);
    throw new Error('Failed to send WhatsApp via Twilio');
  }
};

/**
 * Verify WhatsApp configuration
 */
export const verifyWhatsAppConfig = () => {
  if (!whatsappConfig.phoneNumberId || !whatsappConfig.accessToken) {
    console.warn('⚠️  WhatsApp not configured. Messages will not be sent.');
    return false;
  }
  console.log('✅ WhatsApp configuration verified');
  return true;
};

export default {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  sendWhatsAppViaTwilio,
  verifyWhatsAppConfig,
};