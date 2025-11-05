import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

interface WhatsAppRequestBody {
  to: string
  message: string
  messageType?: string
  metadata?: Record<string, any>
}

/**
 * Send WhatsApp message using WhatsApp Business API
 * POST /api/whatsapp/send
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: WhatsAppRequestBody = await request.json()
    const { to, message, messageType = 'notification', metadata = {} } = body

    // Validate required fields
    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      )
    }

    // Validate phone number format (should be 10 digits for Indian numbers)
    const cleanPhone = to.replace(/\D/g, '')
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please provide a 10-digit number.' },
        { status: 400 }
      )
    }

    // Format phone number for WhatsApp (add country code)
    const whatsappNumber = `91${cleanPhone}` // Indian country code

    // Get user session from Authorization header
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null
    let gymId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)
        if (user) {
          userId = user.id
          
          // Get gym_id from user's gym
          const { data: gym } = await supabaseAdmin
            .from('gyms')
            .select('id')
            .eq('owner_id', userId)
            .single()
          
          if (gym) {
            gymId = gym.id
          }
        }
      } catch (error) {
        console.error('Error getting user from token:', error)
      }
    }

    let whatsappSent = false
    let whatsappError = null

    // Send via Twilio
    if (twilioClient) {
      try {
        console.log('Sending WhatsApp via Twilio...')
        
        // Format phone number for Twilio WhatsApp
        const twilioTo = `whatsapp:+${whatsappNumber}`
        
        // Send message using Twilio SDK
        const twilioMessage = await twilioClient.messages.create({
          body: message,
          from: TWILIO_WHATSAPP_FROM,
          to: twilioTo
        })

        whatsappSent = true
        console.log('✅ WhatsApp sent via Twilio:', twilioMessage.sid)
      } catch (error: any) {
        console.error('❌ Error sending WhatsApp via Twilio:', error)
        whatsappError = error.message
      }
    } 
    // Fallback to generic WhatsApp API
    else {
      const whatsappApiKey = process.env.WHATSAPP_API_KEY
      const whatsappApiUrl = process.env.WHATSAPP_API_URL

      if (whatsappApiKey && whatsappApiUrl) {
        try {
          const whatsappResponse = await fetch(whatsappApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${whatsappApiKey}`,
            },
            body: JSON.stringify({
              to: whatsappNumber,
              type: 'text',
              text: {
                body: message,
              },
            }),
          })

          if (whatsappResponse.ok) {
            whatsappSent = true
          } else {
            const errorData = await whatsappResponse.json()
            whatsappError = errorData.error || 'WhatsApp API error'
            console.error('WhatsApp API error:', errorData)
          }
        } catch (error: any) {
          console.error('Error sending WhatsApp:', error)
          whatsappError = error.message
        }
      } else {
        // No WhatsApp API configured - log message only
        console.log('⚠️ No WhatsApp API configured. Message logged to database only.')
        console.log(`Would send to: ${whatsappNumber}`)
        console.log(`Message preview: ${message.substring(0, 100)}...`)
      }
    }

    // Log message to database regardless of WhatsApp send status
    if (gymId) {
      try {
        const { error: logError } = await supabaseAdmin
          .from('whatsapp_messages')
          .insert({
            gym_id: gymId,
            phone: cleanPhone,
            message,
            status: whatsappSent ? 'sent' : (whatsappError ? 'failed' : 'pending'),
            message_type: messageType,
            metadata: {
              ...metadata,
              whatsapp_number: whatsappNumber,
              error: whatsappError,
            },
            sent_at: whatsappSent ? new Date().toISOString() : null,
          })

        if (logError) {
          console.error('Error logging WhatsApp message:', logError)
        }
      } catch (logError) {
        console.error('Error logging message to database:', logError)
      }
    }

    // Return response
    if (whatsappSent) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp message sent successfully',
        to: whatsappNumber,
      })
    } else if (whatsappError) {
      return NextResponse.json({
        success: false,
        error: whatsappError,
        message: 'Failed to send WhatsApp message, but logged to database',
        logged: true,
      }, { status: 500 })
    } else {
      // WhatsApp API not configured
      return NextResponse.json({
        success: true,
        message: 'WhatsApp API not configured. Message logged to database.',
        logged: true,
        note: 'To enable WhatsApp sending, configure WHATSAPP_API_KEY and WHATSAPP_API_URL in environment variables.',
      })
    }

  } catch (error: any) {
    console.error('Error in WhatsApp send API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
