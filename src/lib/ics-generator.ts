import { createEvents, EventAttributes } from 'ics'

export interface CalendarEventData {
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
}

export function generateICS(eventData: CalendarEventData): string | null {
  try {
    const start = new Date(eventData.startTime)
    const end = new Date(eventData.endTime)

    const event: EventAttributes = {
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      status: 'CONFIRMED',
      busyStatus: 'BUSY'
    }

    const { error, value } = createEvents([event])
    
    if (error) {
      console.error('Error creating ICS file:', error)
      return null
    }
    
    return value || null
  } catch (error) {
    console.error('Error generating ICS:', error)
    return null
  }
}

export function generateGoogleCalendarLink(eventData: CalendarEventData): string {
  const start = new Date(eventData.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const end = new Date(eventData.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventData.title,
    details: eventData.description,
    location: eventData.location,
    dates: start + '/' + end
  })

  return 'https://calendar.google.com/calendar/render?' + params.toString()
}

export function downloadICS(icsContent: string, filename: string = 'wedding.ics'): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
