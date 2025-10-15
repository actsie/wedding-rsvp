'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Search } from 'lucide-react'
import { RSVPRecord } from '@/lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const [rsvps, setRsvps] = useState<RSVPRecord[]>([])
  const [filteredRsvps, setFilteredRsvps] = useState<RSVPRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [attendingFilter, setAttendingFilter] = useState<'all' | 'yes' | 'no'>('all')

  const filterRSVPs = useCallback(() => {
    let filtered = [...rsvps]

    if (searchTerm) {
      filtered = filtered.filter(
        (rsvp) =>
          rsvp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rsvp.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (attendingFilter !== 'all') {
      filtered = filtered.filter((rsvp) =>
        attendingFilter === 'yes' ? rsvp.attending : !rsvp.attending
      )
    }

    setFilteredRsvps(filtered)
  }, [rsvps, searchTerm, attendingFilter])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      router.push('/')
      return
    }

    fetchRSVPs()
  }, [router])

  useEffect(() => {
    filterRSVPs()
  }, [filterRSVPs])

  const fetchRSVPs = async () => {
    try {
      const response = await fetch('/api/rsvp')
      if (!response.ok) {
        throw new Error('Failed to fetch RSVPs')
      }
      const result = await response.json()
      setRsvps(result.data || [])
      setFilteredRsvps(result.data || [])
    } catch (error) {
      console.error('Error fetching RSVPs:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Attending', 'Guests', 'Notes', 'Submitted At']
    const rows = filteredRsvps.map((rsvp) => [
      rsvp.full_name,
      rsvp.email,
      rsvp.attending ? 'Yes' : 'No',
      rsvp.guests,
      rsvp.notes || '',
      new Date(rsvp.created_at || '').toLocaleString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `wedding-rsvps-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const stats = {
    total: rsvps.length,
    attending: rsvps.filter((r) => r.attending).length,
    notAttending: rsvps.filter((r) => !r.attending).length,
    totalGuests: rsvps.reduce((sum, r) => sum + (r.attending ? r.guests : 0), 0),
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">RSVP Admin Dashboard</h1>
              <p className="text-gray-600">Manage and export your wedding RSVPs</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push('/admin/editor')} className="bg-rose-600 hover:bg-rose-700">
              Edit Details
            </Button>
            <Button onClick={() => router.push('/admin/faq-editor')} className="bg-rose-600 hover:bg-rose-700">
              Edit FAQs
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Total RSVPs</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Attending</p>
            <p className="text-3xl font-bold text-green-600">{stats.attending}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Not Attending</p>
            <p className="text-3xl font-bold text-red-600">{stats.notAttending}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Total Guests</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalGuests}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={attendingFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setAttendingFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={attendingFilter === 'yes' ? 'default' : 'outline'}
                  onClick={() => setAttendingFilter('yes')}
                  size="sm"
                >
                  Attending
                </Button>
                <Button
                  variant={attendingFilter === 'no' ? 'default' : 'outline'}
                  onClick={() => setAttendingFilter('no')}
                  size="sm"
                >
                  Not Attending
                </Button>
              </div>
              <Button onClick={exportToCSV} className="bg-rose-600 hover:bg-rose-700">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRsvps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No RSVPs found
                    </td>
                  </tr>
                ) : (
                  filteredRsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{rsvp.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rsvp.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            rsvp.attending
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rsvp.attending ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rsvp.guests}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {rsvp.notes || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(rsvp.created_at || '').toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Wedding Site
          </Button>
        </div>
      </div>
    </div>
  )
}
