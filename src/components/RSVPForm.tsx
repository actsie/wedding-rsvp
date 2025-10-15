'use client'

import { useState, FormEvent } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { validateEmail } from '@/lib/utils'
import { generateICS, generateGoogleCalendarLink, downloadICS, CalendarEventData } from '@/lib/ics-generator'

interface RSVPFormProps {
  labels: {
    name: string
    email: string
    attending: string
    guests: string
    notes: string
  }
  eventData: CalendarEventData
}

interface FormErrors {
  name?: string
  email?: string
  attending?: string
  guests?: string
}

export function RSVPForm({ labels, eventData }: RSVPFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    attending: '',
    guests: '1',
    notes: '',
    honeypot: '' // Hidden field for spam prevention
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.fullName.length > 100) {
      newErrors.name = 'Name must be less than 100 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.attending) {
      newErrors.attending = 'Please let us know if you can attend'
    }

    const guestCount = parseInt(formData.guests)
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 2) {
      newErrors.guests = 'Number of guests must be between 1 and 2'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const [submittedData, setSubmittedData] = useState<{
    fullName: string
    email: string
    attending: string
    guests: string
  } | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Check honeypot - show success to bot but don't actually submit
    if (formData.honeypot) {
      console.warn('Honeypot triggered - spam bot detected')
      // Show fake success to avoid giving feedback to bots
      setSubmitStatus('success')
      setSubmittedData({
        fullName: formData.fullName,
        email: formData.email,
        attending: formData.attending,
        guests: formData.guests
      })
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          attending: formData.attending === 'yes',
          guests: parseInt(formData.guests),
          notes: formData.notes,
          honeypot: formData.honeypot, // Send honeypot to server for logging
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit RSVP')
      }

      setSubmitStatus('success')
      setSubmittedData({
        fullName: formData.fullName,
        email: formData.email,
        attending: formData.attending,
        guests: formData.guests
      })
      setFormData({
        fullName: '',
        email: '',
        attending: '',
        guests: '1',
        notes: '',
        honeypot: ''
      })
    } catch (error) {
      console.error('RSVP submission error:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadICS = () => {
    const icsContent = generateICS(eventData)
    if (icsContent) {
      downloadICS(icsContent)
    }
  }

  const handleGoogleCalendar = () => {
    const link = generateGoogleCalendarLink(eventData)
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  if (submitStatus === 'success' && submittedData) {
    const isAttending = submittedData.attending === 'yes'

    return (
      <div className="text-center space-y-6 py-8 px-4" role="status" aria-live="polite">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" aria-hidden="true" />
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Thank You{isAttending ? '!' : ' for Letting Us Know'}
          </h3>
          <p className="text-gray-700 max-w-md mx-auto">
            {isAttending
              ? "We've received your RSVP and can't wait to celebrate with you!"
              : "We've received your RSVP. You'll be missed, but we understand."
            }
          </p>
        </div>

        {/* RSVP Summary */}
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 max-w-md mx-auto text-left space-y-3">
          <h4 className="font-semibold text-gray-900 text-center mb-4">Your RSVP Summary</h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-rose-200">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-900">{submittedData.fullName}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-rose-200">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{submittedData.email}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-rose-200">
              <span className="text-gray-600">Attending:</span>
              <span className={`font-medium ${isAttending ? 'text-green-600' : 'text-gray-600'}`}>
                {isAttending ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-gray-600">Number of Guests:</span>
              <span className="font-medium text-gray-900">{submittedData.guests}</span>
            </div>
          </div>
        </div>

        {/* Calendar Actions - Only show if attending */}
        {isAttending && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <p className="text-base font-medium text-gray-900">Save the Date</p>
              <p className="text-sm text-gray-600">Add this event to your calendar so you don&apos;t forget!</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
              <Button
                onClick={handleDownloadICS}
                variant="outline"
                size="lg"
                className="min-h-[44px] border-rose-600 text-rose-600 hover:bg-rose-50 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                aria-label="Download calendar file to import into your calendar app"
              >
                Download .ics File
              </Button>
              <Button
                onClick={handleGoogleCalendar}
                size="lg"
                className="min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                aria-label="Open Google Calendar to add this event"
              >
                Add to Google Calendar
              </Button>
            </div>

            <p className="text-xs text-gray-500 max-w-md mx-auto">
              The .ics file works with Apple Calendar, Outlook, and most calendar apps.
              Google Calendar will open in a new tab.
            </p>
          </div>
        )}

        {/* Confirmation message */}
        <p className="text-sm text-gray-600 pt-4 max-w-md mx-auto">
          {isAttending
            ? "A confirmation email has been sent to your inbox with all the details."
            : "If you change your mind, feel free to reach out to us!"
          }
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {submitStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-base">
          {labels.name} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fullName"
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className={errors.name ? 'border-red-500' : ''}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base">
          {labels.email} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={errors.email ? 'border-red-500' : ''}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      {/* Attending Field */}
      <div className="space-y-2">
        <Label className="text-base">
          {labels.attending} <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="attending"
              value="yes"
              checked={formData.attending === 'yes'}
              onChange={(e) => setFormData({ ...formData, attending: e.target.value })}
              disabled={isSubmitting}
              className="w-4 h-4 text-rose-600 focus:ring-rose-500"
            />
            <span>Yes, I&apos;ll be there!</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="attending"
              value="no"
              checked={formData.attending === 'no'}
              onChange={(e) => setFormData({ ...formData, attending: e.target.value })}
              disabled={isSubmitting}
              className="w-4 h-4 text-rose-600 focus:ring-rose-500"
            />
            <span>Sorry, can&apos;t make it</span>
          </label>
        </div>
        {errors.attending && (
          <p className="text-sm text-red-600">{errors.attending}</p>
        )}
      </div>

      {/* Guests Field */}
      <div className="space-y-2">
        <Label htmlFor="guests" className="text-base">
          {labels.guests}
        </Label>
        <Input
          id="guests"
          type="number"
          min="1"
          max="2"
          value={formData.guests}
          onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
          className={errors.guests ? 'border-red-500' : ''}
          disabled={isSubmitting}
          aria-describedby={errors.guests ? 'guests-error' : undefined}
        />
        <p className="text-sm text-gray-600">Maximum 2 guests per RSVP</p>
        {errors.guests && (
          <p id="guests-error" className="text-sm text-red-600">
            {errors.guests}
          </p>
        )}
      </div>

      {/* Notes Field */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base">
          {labels.notes}
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any dietary restrictions or special requests?"
          disabled={isSubmitting}
          rows={4}
        />
      </div>

      {/* Honeypot Field (hidden) */}
      <input
        type="text"
        name="website"
        value={formData.honeypot}
        onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
        style={{ position: 'absolute', left: '-9999px' }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          size="lg"
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit RSVP'
          )}
        </Button>
      </div>
    </form>
  )
}
