'use client'

import Image from 'next/image'
import { Button } from './ui/button'
import { formatDate } from '@/lib/utils'

interface HeroProps {
  bride: string
  groom: string
  date: string
  venue: string
  heroImage?: string
  onRSVPClick: () => void
}

export function Hero({ bride, groom, date, venue, heroImage, onRSVPClick }: HeroProps) {
  const formattedDate = formatDate(date)

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-white px-4 py-16"
      aria-label="Wedding hero section"
    >
      {heroImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt="Wedding hero"
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>
      )}
      
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light text-gray-900">
            {bride} <span className="text-rose-500">&</span> {groom}
          </h1>
          
          <div className="space-y-2 text-lg sm:text-xl md:text-2xl text-gray-700">
            <p className="font-light">{formattedDate}</p>
            <p className="font-medium">{venue}</p>
          </div>
        </div>

        <div className="pt-8">
          <Button
            onClick={onRSVPClick}
            size="xl"
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            aria-label="Open RSVP form"
          >
            RSVP Now
          </Button>
        </div>

        <div className="pt-4 text-sm text-gray-600">
          <p>We can&apos;t wait to celebrate with you!</p>
        </div>
      </div>
    </section>
  )
}
