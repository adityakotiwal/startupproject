import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Validate Twilio configuration
if (!accountSid || !authToken || !whatsappNumber) {
  console.error('Missing Twilio configuration. Please check your .env.local file.');
}

// Create Twilio client (only if credentials are available)
const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Format phone number to E.164 format
 * @param phoneNumber - Phone number in any format
 * @param defaultCountryCode - Default country code if not provided (default: +91 for India)
 * @returns Formatted phone number in E.164 format
 */
export function formatPhoneNumber(phoneNumber: string, defaultCountryCode: string = '+91'): string {
  // Remove all non-numeric characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add the default country code
  if (!cleaned.startsWith('+')) {
    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');
    cleaned = `${defaultCountryCode}${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Send a WhatsApp message using Twilio
 * @param to - Recipient phone number (will be formatted to E.164)
 * @param message - Message content to send
 * @returns Promise with message SID or error
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    // Check if Twilio is configured
    if (!twilioClient || !whatsappNumber) {
      console.error('Twilio is not configured. Please set up environment variables.');
      return {
        success: false,
        error: 'WhatsApp service is not configured',
      };
    }

    // Format the recipient number
    const formattedTo = formatPhoneNumber(to);
    
    // Ensure the number has whatsapp: prefix
    const whatsappTo = formattedTo.startsWith('whatsapp:') 
      ? formattedTo 
      : `whatsapp:${formattedTo}`;

    // Send the message
    const sentMessage = await twilioClient.messages.create({
      body: message,
      from: whatsappNumber,
      to: whatsappTo,
    });

    console.log(`WhatsApp message sent successfully. SID: ${sentMessage.sid}`);
    
    return {
      success: true,
      messageSid: sentMessage.sid,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message',
    };
  }
}

/**
 * Send bulk WhatsApp messages to multiple recipients
 * @param recipients - Array of recipient phone numbers
 * @param message - Message content to send
 * @returns Promise with results for each recipient
 */
export async function sendBulkWhatsAppMessages(
  recipients: string[],
  message: string
): Promise<Array<{ to: string; success: boolean; messageSid?: string; error?: string }>> {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendWhatsAppMessage(recipient, message);
    results.push({
      to: recipient,
      ...result,
    });
    
    // Add a small delay to avoid rate limiting (100ms between messages)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Check if WhatsApp service is available
 * @returns Boolean indicating if Twilio is properly configured
 */
export function isWhatsAppAvailable(): boolean {
  return !!(accountSid && authToken && whatsappNumber && twilioClient);
}

/**
 * Get WhatsApp configuration status
 * @returns Object with configuration details
 */
export function getWhatsAppConfig() {
  return {
    isConfigured: isWhatsAppAvailable(),
    accountSid: accountSid ? `${accountSid.substring(0, 8)}...` : 'Not set',
    whatsappNumber: whatsappNumber || 'Not set',
  };
}
