'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Save, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react'

interface ScheduleItem {
  time: string
  label: string
}

interface SiteConfig {
  meta: {
    title: string
    bride: string
    groom: string
    date: string
    venue: string
    heroImage: string
  }
  details: {
    schedule: ScheduleItem[]
    dressCode: string
    address: string
    mapLink: string
  }
  faq: Array<{ q: string; a: string }>
  contact: {
    email: string
    message: string
  }
  formLabels: {
    name: string
    email: string
    attending: string
    guests: string
    notes: string
  }
}

export default function EditorPage() {
  const router = useRouter()
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      router.push('/')
      return
    }

    fetchConfig()
  }, [router])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/site-config')
      if (!response.ok) throw new Error('Failed to fetch config')
      const result = await response.json()
      setConfig(result.data)
    } catch (error) {
      console.error('Error fetching config:', error)
      showToast('Failed to load configuration', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    try {
      const response = await fetch('/api/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) throw new Error('Failed to save')

      showToast('Changes saved successfully!', 'success')
    } catch (error) {
      console.error('Error saving config:', error)
      showToast('Failed to save changes', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addScheduleItem = () => {
    if (!config) return
    setConfig({
      ...config,
      details: {
        ...config.details,
        schedule: [...config.details.schedule, { time: '', label: '' }],
      },
    })
  }

  const updateScheduleItem = (index: number, field: 'time' | 'label', value: string) => {
    if (!config) return
    const newSchedule = [...config.details.schedule]
    newSchedule[index] = { ...newSchedule[index], [field]: value }
    setConfig({
      ...config,
      details: { ...config.details, schedule: newSchedule },
    })
  }

  const removeScheduleItem = (index: number) => {
    if (!config) return
    setConfig({
      ...config,
      details: {
        ...config.details,
        schedule: config.details.schedule.filter((_, i) => i !== index),
      },
    })
  }

  const generateMapLink = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    return 'https://maps.google.com/?q=' + encodedAddress
  }

  const handleAddressChange = (address: string) => {
    if (!config) return
    setConfig({
      ...config,
      details: {
        ...config.details,
        address,
        mapLink: generateMapLink(address),
      },
    })
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Failed to load configuration</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Editor</h1>
            <p className="text-gray-600">Edit your wedding website content</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {toast && (
          <div
            className={'mb-6 p-4 rounded-lg ' + (toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200')}
          >
            {toast.message}
          </div>
        )}

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Schedule</h2>
            <div className="space-y-4">
              {config.details.schedule.map((item, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1 grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={'time-' + index}>Time</Label>
                      <Input
                        id={'time-' + index}
                        type="text"
                        placeholder="15:00"
                        value={item.time}
                        onChange={(e) => updateScheduleItem(index, 'time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={'label-' + index}>Event</Label>
                      <Input
                        id={'label-' + index}
                        type="text"
                        placeholder="Ceremony"
                        value={item.label}
                        onChange={(e) => updateScheduleItem(index, 'label', e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeScheduleItem(index)}
                    className="mt-6"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addScheduleItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule Item
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Venue & Dress Code</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Venue Address</Label>
                <Textarea
                  id="address"
                  placeholder="123 Grove Street, Green Valley, CA 94000"
                  value={config.details.address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-gray-600 mt-1">
                  This will automatically generate a map link
                </p>
              </div>
              <div>
                <Label htmlFor="dressCode">Dress Code</Label>
                <Input
                  id="dressCode"
                  type="text"
                  placeholder="Semi-formal"
                  value={config.details.dressCode}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      details: { ...config.details, dressCode: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
              Preview Site
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
