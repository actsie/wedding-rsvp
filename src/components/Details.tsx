'use client'

import { useState } from 'react'
import { MapPin, Clock, Copy, Check } from 'lucide-react'
import { Button } from './ui/button'

interface ScheduleItem {
  time: string
  label: string
}

interface DetailsProps {
  schedule: ScheduleItem[]
  dressCode: string
  address: string
  mapLink: string
}

export function Details({ schedule, dressCode, address, mapLink }: DetailsProps) {
  const [copied, setCopied] = useState(false)
  const [mapError, setMapError] = useState(false)

  const isValidAddress = address && address.trim().length > 0
  const hasSchedule = schedule && schedule.length > 0

  const handleMapClick = () => {
    if (!isValidAddress || !mapLink) {
      return
    }

    try {
      const opened = window.open(mapLink, '_blank', 'noopener,noreferrer')
      if (!opened) {
        setMapError(true)
      }
    } catch (error) {
      console.error('Error opening maps:', error)
      setMapError(true)
    }
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  return (
    <section 
      className="py-16 px-4 bg-white"
      aria-label="Wedding details section"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif text-center text-gray-900 mb-12">
          Wedding Details
        </h2>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Schedule */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-rose-600 mb-4">
              <Clock className="w-5 h-5" />
              <h3 className="text-xl font-semibold">Schedule</h3>
            </div>
            {hasSchedule ? (
              <div className="space-y-4">
                {schedule.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-baseline gap-4 pb-4 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-lg font-medium text-rose-600 min-w-[80px]">
                      {item.time}
                    </span>
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-rose-50 rounded-lg border border-rose-100">
                <p className="text-gray-600 text-center">
                  Schedule details coming soon
                </p>
              </div>
            )}
          </div>

          {/* Venue & Dress Code */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 text-rose-600 mb-4">
                <MapPin className="w-5 h-5" />
                <h3 className="text-xl font-semibold">Venue</h3>
              </div>
              {isValidAddress ? (
                <>
                  <p className="text-gray-700 mb-4 leading-relaxed break-words">{address}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleMapClick}
                      variant="outline"
                      disabled={!isValidAddress || !mapLink}
                      className="border-rose-600 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Open venue location in maps"
                      title={!isValidAddress || !mapLink ? 'Address is required to open maps' : 'Open in Google Maps or Apple Maps'}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Open in Maps
                    </Button>
                    <Button
                      onClick={handleCopyAddress}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      aria-label="Copy address to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Address
                        </>
                      )}
                    </Button>
                  </div>
                  {mapError && (
                    <p className="text-sm text-gray-600 mt-2">
                      Unable to open maps. Please use the Copy Address button and paste into your maps app.
                    </p>
                  )}
                </>
              ) : (
                <div className="p-6 bg-rose-50 rounded-lg border border-rose-100">
                  <p className="text-gray-600 text-center">
                    Venue address will be announced soon
                  </p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Dress Code</h3>
              <p className="text-gray-700">{dressCode || 'To be announced'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
