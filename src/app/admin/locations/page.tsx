'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import { SkeletonTable } from '@/components/SkeletonLoader'
import { AuthUser } from '@/types/auth'

interface Location {
  id: string
  name: string
  code?: string
  site?: string
  address?: string
  isActive: boolean
}

export default function LocationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', code: '', site: '', address: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const { user: authUser } = await res.json()
        if (!authUser || !authUser.role.includes('ADMIN')) {
          router.push('/dashboard')
          return
        }
        setUser(authUser)

        const locationsRes = await fetch('/api/locations')
        const { locations: fetchedLocations } = await locationsRes.json()
        setLocations(fetchedLocations || [])
        setLoading(false)
      } catch (error) {
        console.error('Failed to load data:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const newLocation = await res.json()
        setLocations([...locations, newLocation])
        setFormData({ name: '', code: '', site: '', address: '' })
        setShowForm(false)
      }
    } catch (error) {
      console.error('Failed to create location:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || loading) return null

  return (
    <LayoutWrapper user={user} pageTitle="Locations">
      <ContentContainer>
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-600">Manage office locations and sites</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancel' : '+ Add Location'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Location Name"
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Code"
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.site}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                  placeholder="Site"
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Address"
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !formData.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {submitting ? 'Creating...' : 'Create Location'}
              </button>
            </form>
          </div>
        )}

        {locations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 font-medium mb-2">No locations yet</p>
            <p className="text-sm text-gray-500">Add your first location to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {locations.map(location => (
                  <tr key={location.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{location.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{location.code || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{location.site || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{location.address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentContainer>
    </LayoutWrapper>
  )
}
