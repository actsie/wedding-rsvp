// file: lib/email.ts
// Why: server-only, env-driven, safe defaults for RSVP notifications.
import { Resend } from 'resend'

// Initialize Resend only if API key is configured
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.RSVP_NOTIFY_FROM || 'Our Wedding <noreply@yourdomain.com>'
const TO = (process.env.RSVP_NOTIFY_TO || process.env.NOTIFICATION_EMAIL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

export type RsvpPayload = {
  name: string
  email: string
  attending: boolean
  guests: number
  notes?: string
  createdAt?: Date
}

export async function sendRsvpNotification(rsvp: RsvpPayload) {
  // Skip if Resend is not configured
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn('Resend API key not configured, skipping email notification')
    return null
  }

  if (TO.length === 0) {
    console.warn('No notification email configured, skipping email notification')
    return null
  }

  // Why: let you reply to the guest from your email client
  const replyTo = rsvp.email

  const html = `
    <h2>New RSVP Received</h2>
    <p><strong>Name:</strong> ${rsvp.name}</p>
    <p><strong>Email:</strong> ${rsvp.email}</p>
    <p><strong>Attending:</strong> ${rsvp.attending ? 'Yes' : 'No'}</p>
    <p><strong>Number of Guests:</strong> ${rsvp.guests}</p>
    ${rsvp.notes ? `<p><strong>Notes:</strong> ${rsvp.notes}</p>` : ''}
    <p><small>Submitted: ${(rsvp.createdAt ?? new Date()).toLocaleString()}</small></p>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM, // e.g., 'Our Wedding <noreply@yourdomain.com>'
      to: TO.length ? TO : ['you@example.com'],
      subject: `RSVP: ${rsvp.name} — ${rsvp.attending ? 'Yes' : 'No'} (${rsvp.guests} guest${rsvp.guests !== 1 ? 's' : ''})`,
      html,
      replyTo, // guest's email, so you can reply directly
    })

    if (error) {
      // Why: keep logs server-side without leaking details to the client
      console.error('Resend error:', error)
      throw new Error('Failed to send RSVP notification')
    }

    console.log('RSVP notification sent successfully:', data)
    return data
  } catch (error) {
    console.error('Error sending RSVP notification:', error)
    throw error
  }
}
