/**
 * WhatsApp Helper Functions
 * These functions make it easy to send WhatsApp messages from anywhere in the app
 */

import { generateWelcomeMessage, generateRenewalReminder, generatePaymentConfirmation, generateFeeDueNotification, WelcomeMessageParams, RenewalReminderParams, PaymentConfirmationParams, FeeDueParams } from './whatsapp-templates';
import { supabase } from './supabaseClient';

/**
 * Get auth headers for API requests
 */
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  return headers;
}

/**
 * Send welcome WhatsApp message to new member
 */
export async function sendWelcomeWhatsApp(params: {
  memberName: string;
  memberPhone: string;
  gymName: string;
  membershipPlan: string;
  startDate: string;
  validityDays: number;
  memberId?: string;
}) {
  try {
    const message = generateWelcomeMessage({
      memberName: params.memberName,
      gymName: params.gymName,
      membershipPlan: params.membershipPlan,
      startDate: params.startDate,
      validityDays: params.validityDays,
    });

    const headers = await getAuthHeaders();

    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: params.memberPhone,
        message,
        messageType: 'welcome',
        metadata: {
          member_id: params.memberId,
          member_name: params.memberName,
        },
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to send welcome WhatsApp:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Welcome WhatsApp sent successfully');
    return { success: true, messageSid: result.messageSid };
  } catch (error: any) {
    console.error('Error sending welcome WhatsApp:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send renewal reminder WhatsApp message
 */
export async function sendRenewalReminderWhatsApp(params: {
  memberName: string;
  memberPhone: string;
  gymName: string;
  membershipPlan: string;
  expiryDate: string;
  daysRemaining: number;
  memberId?: string;
}) {
  try {
    const message = generateRenewalReminder({
      memberName: params.memberName,
      gymName: params.gymName,
      membershipPlan: params.membershipPlan,
      expiryDate: params.expiryDate,
      daysRemaining: params.daysRemaining,
    });

    const headers = await getAuthHeaders();

    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: params.memberPhone,
        message,
        messageType: 'renewal',
        metadata: {
          member_id: params.memberId,
          member_name: params.memberName,
          expiry_date: params.expiryDate,
        },
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to send renewal reminder:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Renewal reminder sent successfully');
    return { success: true, messageSid: result.messageSid };
  } catch (error: any) {
    console.error('Error sending renewal reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send payment confirmation WhatsApp message
 */
export async function sendPaymentConfirmationWhatsApp(params: {
  memberName: string;
  memberPhone: string;
  gymName?: string;
  amount: number;
  currency?: string;
  paymentDate: string;
  receiptNumber?: string;
  paymentMethod: string;
  memberId?: string;
  paymentId?: string;
}) {
  try {
    const message = generatePaymentConfirmation({
      memberName: params.memberName,
      gymName: params.gymName || 'Our Gym',
      amount: params.amount,
      currency: params.currency || '₹',
      paymentDate: params.paymentDate,
      paymentMode: params.paymentMethod,
      receiptNumber: params.receiptNumber,
    });

    const headers = await getAuthHeaders();

    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: params.memberPhone,
        message,
        messageType: 'payment',
        metadata: {
          member_id: params.memberId,
          payment_id: params.paymentId,
          amount: params.amount,
        },
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to send payment confirmation:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Payment confirmation sent successfully');
    return { success: true, messageSid: result.messageSid };
  } catch (error: any) {
    console.error('Error sending payment confirmation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send fee due notification WhatsApp message
 */
export async function sendFeeDueWhatsApp(params: {
  memberName: string;
  memberPhone: string;
  gymName: string;
  dueAmount: number;
  currency?: string;
  dueDate: string;
  memberId?: string;
}) {
  try {
    const message = generateFeeDueNotification({
      memberName: params.memberName,
      gymName: params.gymName,
      dueAmount: params.dueAmount,
      currency: params.currency || '₹',
      dueDate: params.dueDate,
    });

    const headers = await getAuthHeaders();

    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: params.memberPhone,
        message,
        messageType: 'fee_due',
        metadata: {
          member_id: params.memberId,
          due_amount: params.dueAmount,
          due_date: params.dueDate,
        },
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to send fee due notification:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Fee due notification sent successfully');
    return { success: true, messageSid: result.messageSid };
  } catch (error: any) {
    console.error('Error sending fee due notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send bulk WhatsApp messages
 */
export async function sendBulkWhatsApp(params: {
  recipients: Array<{ phone: string; name: string }>;
  message: string;
  messageType?: string;
}) {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch('/api/whatsapp/send', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        recipients: params.recipients.map(r => r.phone),
        message: params.message,
        messageType: params.messageType || 'bulk',
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to send bulk WhatsApp:', result.error);
      return { success: false, error: result.error };
    }

    console.log(`✅ Bulk WhatsApp sent: ${result.summary.successful}/${result.summary.total} successful`);
    return { success: true, results: result.results, summary: result.summary };
  } catch (error: any) {
    console.error('Error sending bulk WhatsApp:', error);
    return { success: false, error: error.message };
  }
}
