'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import EmptyState from '@/components/EmptyState'
import Alert from '@/components/Alert'
import { SkeletonTable } from '@/components/SkeletonLoader'
import { AuthUser } from '@/types/auth'

interface AssetType {
  id: string
  name: string
  code: string
}

export default function AssetTypesPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [types, setTypes] = useState<AssetType[]>([])
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({ name: '', code: '' })
  const [loading, setLoading] = useState(true)

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

        // Fetch asset types from database
        const typesRes = await fetch('/api/asset-types')
        const { types: fetchedTypes } = await typesRes.json()
        setTypes(fetchedTypes)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load data:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.code) return

    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/asset-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code.toUpperCase(),
        }),
      })

      if (res.ok) {
        const newType = await res.json()
        setTypes([...types, newType])
        setFormData({ name: '', code: '' })
        setShowForm(false)
        setSuccess(`Asset type "${formData.name}" created successfully`)
        setTimeout(() => setSuccess(''), 4000)
      } else {
        setError('Failed to create asset type')
      }
    } catch (error) {
      console.error('Failed to create asset type:', error)
      setError('Error creating asset type')
    } finally {
      setCreating(false)
    }
  }

  if (!user) return null

  return (
    <LayoutWrapper user={user} pageTitle="Asset Types">
      <ContentContainer>
        {/* Page Description & Actions */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-600">Manage asset type catalog</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
          >
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        </div>
        {success && (
          <div className="mb-6">
            <Alert
              type="success"
              title="Success"
              message={success}
              onClose={() => setSuccess('')}
            />
          </div>
        )}

        {error && (
          <div className="mb-6">
            <Alert
              type="error"
              title="Error"
              message={error}
              onClose={() => setError('')}
            />
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Asset Type</h2>
            <form onSubmit={handleAddType} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Laptop, Monitor, Keyboard"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Full name of the asset type</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                  <input
                    type="text"
                    placeholder="e.g., LAP, MON, KEY"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    maxLength={5}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Short code (max 5 chars)</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Type'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Asset Types Table */}
        {loading ? (
          <SkeletonTable rows={5} columns={3} />
        ) : types.length === 0 ? (
          <EmptyState
            icon="🏷️"
            title="No Asset Types Yet"
            description="Create your first asset type to get started"
            action={{ label: '+ Add Type', onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Asset Types</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{types.length} types</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Type Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Code</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {types.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">{type.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">[{type.code}]</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{types.length}</span> asset type{types.length !== 1 ? 's' : ''} in system
              </p>
            </div>
          </div>
        )}
      </ContentContainer>
    </LayoutWrapper>
  )
}
