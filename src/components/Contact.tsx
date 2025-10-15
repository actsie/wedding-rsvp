'use client'

import { useState } from 'react'
import { Mail, Copy, Check } from 'lucide-react'
import { Button } from './ui/button'

interface ContactProps {
  email: string
  message: string
}

// Analytics helper - pushes to dataLayer if available, otherwise logs to console
function trackContactEvent(method: 'mailto' | 'copy', success: boolean = true) {
  const event = {
    event: 'contact_interaction',
    contact_method: method,
    contact_success: success,
    timestamp: new Date().toISOString(),
  }

  // Push to Google Analytics dataLayer if available
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push(event)
  } else {
    // Fallback to console for development/debugging
    console.log('[Analytics Event]', event)
  }
}

export function Contact({ email, message }: ContactProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // Create mailto link with pre-filled subject and body
  const mailtoSubject = encodeURIComponent('Wedding Inquiry')
  const mailtoBody = encodeURIComponent('Hello,\n\nI have a question about your wedding:\n\n')
  const mailtoLink = `mailto:${email}?subject=${mailtoSubject}&body=${mailtoBody}`

  const handleMailtoClick = () => {
    // Track mailto click
    trackContactEvent('mailto', true)

    // The browser will handle opening the mail client
    // We use a proper <a> tag so this is just for tracking
  }

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopyStatus('success')
      setToastMessage('Email address copied to clipboard!')
      setToastType('success')
      setShowToast(true)

      // Track successful copy
      trackContactEvent('copy', true)

      // Reset copy status after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle')
      }, 2000)

      // Hide toast after 5 seconds
      setTimeout(() => {
        setShowToast(false)
      }, 5000)
    } catch (error) {
      setCopyStatus('error')
      setToastMessage('Failed to copy email address. Please try selecting and copying manually.')
      setToastType('error')
      setShowToast(true)

      // Track failed copy
      trackContactEvent('copy', false)

      // Reset error status after 3 seconds
      setTimeout(() => {
        setCopyStatus('idle')
      }, 3000)

      // Hide toast after 6 seconds (longer for error messages)
      setTimeout(() => {
        setShowToast(false)
      }, 6000)
    }
  }

  const handleCopyKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCopyEmail()
    }
  }

  return (
    <section
      className="py-16 px-4 bg-white"
      aria-label="Contact section"
    >
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-serif text-gray-900">
          Get in Touch
        </h2>

        <p className="text-lg text-gray-700">
          {message}
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Primary mailto button */}
          <a
            href={mailtoLink}
            onClick={handleMailtoClick}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-6 py-3 rounded-md border-2 border-rose-600 text-rose-600 bg-white hover:bg-rose-50 focus:bg-rose-50 active:bg-rose-100 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
            aria-label={`Send email to ${email} with pre-filled subject and greeting`}
            role="button"
          >
            <Mail className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm sm:text-base">{email}</span>
          </a>

          {/* Copy email fallback button */}
          <button
            onClick={handleCopyEmail}
            onKeyDown={handleCopyKeyPress}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-4 py-3 rounded-md border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:bg-gray-50 active:bg-gray-100 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            aria-label="Copy email address to clipboard"
            type="button"
          >
            {copyStatus === 'success' ? (
              <>
                <Check className="w-5 h-5 flex-shrink-0 text-green-600" aria-hidden="true" />
                <span className="text-sm sm:text-base text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm sm:text-base">Copy Email</span>
              </>
            )}
          </button>
        </div>

        {/* Helpful text for users */}
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Click the email address to open your mail app, or use the copy button if you prefer to paste it elsewhere.
        </p>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
          role="alert"
          aria-live="polite"
        >
          <div className={`px-6 py-4 rounded-lg shadow-lg max-w-md ${
            toastType === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            <div className="flex items-center gap-3">
              {toastType === 'success' ? (
                <Check className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              ) : (
                <Mail className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              )}
              <p className="text-sm sm:text-base font-medium">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
