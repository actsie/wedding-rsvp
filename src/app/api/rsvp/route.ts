import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sgMail from '@sendgrid/mail'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Check if Supabase is configured with valid credentials
const isSupabaseConfigured = supabaseUrl &&
  supabaseServiceKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your_')

let supabase: ReturnType<typeof createClient> | null = null

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey)
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error)
    supabase = null
  }
}

// Fallback: Local JSON storage for development
const STORAGE_FILE = path.join(process.cwd(), 'rsvp-data.json')

function getLocalRSVPs() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading local RSVPs:', error)
  }
  return []
}

function saveLocalRSVP(rsvpData: any) {
  try {
    const rsvps = getLocalRSVPs()
    const newRSVP = {
      ...rsvpData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    }
    rsvps.push(newRSVP)
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(rsvps, null, 2))
    return newRSVP
  } catch (error) {
    console.error('Error saving local RSVP:', error)
    throw error
  }
}

function checkLocalDuplicate(email: string, attending: boolean): boolean {
  const rsvps = getLocalRSVPs()
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)

  return rsvps.some((rsvp: any) =>
    rsvp.email === email &&
    rsvp.attending === attending &&
    new Date(rsvp.created_at).getTime() > oneDayAgo
  )
}

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

interface RSVPData {
  full_name: string
  email: string
  attending: boolean
  guests: number
  notes?: string
  honeypot?: string
}

const rateLimit = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimit.get(ip)

  if (!limit || now > limit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + 3600000 })
    return true
  }

  if (limit.count >= 5) {
    return false
  }

  limit.count++
  return true
}

async function checkDuplicateSubmission(email: string, attending: boolean): Promise<boolean> {
  // Use local storage if Supabase not configured
  if (!supabase) {
    return checkLocalDuplicate(email, attending)
  }

  // Check for duplicate with same email + attending status within 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('rsvps')
    .select('id')
    .eq('email', email)
    .eq('attending', attending)
    .gte('created_at', oneDayAgo)
    .limit(1)

  if (error) {
    console.error('Error checking duplicate:', error)
    return false
  }

  return data && data.length > 0
}

async function sendNotificationEmail(rsvpData: RSVPData) {
  if (!process.env.SENDGRID_API_KEY || !process.env.NOTIFICATION_EMAIL) {
    console.warn('SendGrid not configured, skipping email notification')
    return
  }

  const attendingText = rsvpData.attending ? 'Yes' : 'No'
  const notesText = rsvpData.notes || 'None'

  const msg = {
    to: process.env.NOTIFICATION_EMAIL,
    from: process.env.NOTIFICATION_EMAIL,
    subject: 'New RSVP from ' + rsvpData.full_name,
    text: 'New RSVP Received:\n\nName: ' + rsvpData.full_name + '\nEmail: ' + rsvpData.email + '\nAttending: ' + attendingText + '\nNumber of Guests: ' + rsvpData.guests + '\nNotes: ' + notesText,
    html: '<h2>New RSVP Received</h2><p><strong>Name:</strong> ' + rsvpData.full_name + '</p><p><strong>Email:</strong> ' + rsvpData.email + '</p><p><strong>Attending:</strong> ' + attendingText + '</p><p><strong>Number of Guests:</strong> ' + rsvpData.guests + '</p><p><strong>Notes:</strong> ' + notesText + '</p>',
  }

  try {
    await sgMail.send(msg)
    console.log('Notification email sent successfully')
  } catch (error) {
    console.error('Error sending notification email:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body: RSVPData = await request.json()

    // Check honeypot - if filled, reject as spam but return success to avoid bot feedback
    if (body.honeypot && body.honeypot.trim().length > 0) {
      console.warn('Honeypot triggered - spam bot detected', { ip, email: body.email })
      // Return generic success to avoid giving feedback to bots
      return NextResponse.json(
        {
          success: true,
          message: 'RSVP submitted successfully'
        },
        { status: 201 }
      )
    }

    // Validate required fields
    if (!body.full_name || !body.email || body.attending === undefined || !body.guests) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Enforce guest limits (cap to 2)
    let guestCount = body.guests
    if (guestCount < 1) {
      guestCount = 1
    } else if (guestCount > 2) {
      guestCount = 2 // Cap to maximum
    }

    // Validate name length
    if (body.full_name.length > 100) {
      return NextResponse.json(
        { error: 'Name is too long' },
        { status: 400 }
      )
    }

    // Check for duplicate submission (same email + attending status)
    const isDuplicate = await checkDuplicateSubmission(body.email, body.attending)
    if (isDuplicate) {
      return NextResponse.json(
        { error: 'You have already submitted an RSVP with this status recently. Please contact us if you need to make changes.' },
        { status: 409 }
      )
    }

    let savedData: any

    // Store RSVP - use Supabase if configured, otherwise use local JSON
    if (supabase) {
      const { data, error } = await supabase
        .from('rsvps')
        .insert([
          {
            full_name: body.full_name,
            email: body.email,
            attending: body.attending,
            guests: guestCount,
            notes: body.notes || null,
            ip_address: ip,
            user_agent: request.headers.get('user-agent') || null,
          },
        ])
        .select()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to save RSVP. Please try again.' },
          { status: 500 }
        )
      }
      savedData = data[0]
    } else {
      // Use local JSON storage for development
      console.log('Using local JSON storage (Supabase not configured)')
      try {
        savedData = saveLocalRSVP({
          full_name: body.full_name,
          email: body.email,
          attending: body.attending,
          guests: guestCount,
          notes: body.notes || null,
          ip_address: ip,
          user_agent: request.headers.get('user-agent') || null,
        })
      } catch (error) {
        console.error('Local storage error:', error)
        return NextResponse.json(
          { error: 'Failed to save RSVP. Please try again.' },
          { status: 500 }
        )
      }
    }

    // Send notification email (non-blocking)
    sendNotificationEmail(body).catch(console.error)

    return NextResponse.json(
      {
        success: true,
        message: 'RSVP submitted successfully',
        data: savedData
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('RSVP submission error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )
  }

  try {
    let data: any[]

    if (supabase) {
      const { data: supabaseData, error } = await supabase
        .from('rsvps')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch RSVPs' },
          { status: 500 }
        )
      }
      data = supabaseData || []
    } else {
      // Use local JSON storage
      data = getLocalRSVPs().sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Error fetching RSVPs:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
