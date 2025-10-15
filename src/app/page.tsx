'use client'

import { useRef, useState, useEffect } from 'react'
import { Hero } from '@/components/Hero'
import { Details } from '@/components/Details'
import { FAQ } from '@/components/FAQ'
import { Contact } from '@/components/Contact'
import { RSVPForm } from '@/components/RSVPForm'
import siteData from '../../content/site.json'

export default function Home() {
  const rsvpRef = useRef<HTMLDivElement>(null)
  const [faqItems, setFaqItems] = useState(siteData.faq)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('faqEntries')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length >= 4 && parsed.length <= 6) {
          setFaqItems(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading FAQs from localStorage:', error)
    }
  }, [])

  const scrollToRSVP = () => {
    rsvpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const eventData = {
    title: `${siteData.meta.bride} & ${siteData.meta.groom} Wedding`,
    description: 'Join us for our wedding celebration',
    location: siteData.details.address,
    startTime: siteData.meta.date,
    endTime: new Date(new Date(siteData.meta.date).getTime() + 6 * 60 * 60 * 1000).toISOString()
  }

  return (
    <main className="min-h-screen">
      <Hero
        bride={siteData.meta.bride}
        groom={siteData.meta.groom}
        date={siteData.meta.date}
        venue={siteData.meta.venue}
        heroImage={siteData.meta.heroImage}
        onRSVPClick={scrollToRSVP}
      />

      <Details
        schedule={siteData.details.schedule}
        dressCode={siteData.details.dressCode}
        address={siteData.details.address}
        mapLink={siteData.details.mapLink}
      />

      <div 
        ref={rsvpRef} 
        className="py-16 px-4 bg-white scroll-mt-16"
        id="rsvp"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif text-center text-gray-900 mb-12">
            RSVP
          </h2>
          <RSVPForm 
            labels={siteData.formLabels} 
            eventData={eventData}
          />
        </div>
      </div>

      <FAQ items={faqItems} />

      <Contact 
        email={siteData.contact.email}
        message={siteData.contact.message}
      />

      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm">
            {siteData.meta.bride} & {siteData.meta.groom} © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  )
}
