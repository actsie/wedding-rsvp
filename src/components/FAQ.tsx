'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItem {
  q: string
  a: string
}

interface FAQProps {
  items: FAQItem[]
}

export function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleFAQ(index)
    }
  }

  return (
    <section 
      className="py-16 px-4 bg-rose-50"
      aria-label="Frequently asked questions"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif text-center text-gray-900 mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              <button
                onClick={() => toggleFAQ(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-medium text-gray-900 text-base md:text-lg">
                  {item.q}
                </span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-rose-600 transition-transform flex-shrink-0",
                    openIndex === index && "transform rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
              
              <div
                id={`faq-answer-${index}`}
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
                role="region"
                aria-labelledby={`faq-question-${index}`}
              >
                <p className="px-6 pb-4 text-gray-700 leading-relaxed">
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
