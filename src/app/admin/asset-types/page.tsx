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
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedType, setSelectedType] = useState<AssetType | null>(null)
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

  const handleEditType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !formData.name || !formData.code) return

    setCreating(true)
    setError('')
    try {
      const res = await fetch(`/api/asset-types/${selectedType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code.toUpperCase(),
        }),
      })

      if (res.ok) {
        const updatedType = await res.json()
        setTypes(types.map(t => t.id === selectedType.id ? updatedType : t))
        setFormData({ name: '', code: '' })
        setShowEditForm(false)
        setSelectedType(null)
        setSuccess(`Asset type "${formData.name}" updated successfully`)
        setTimeout(() => setSuccess(''), 4000)
      } else {
        setError('Failed to update asset type')
      }
    } catch (error) {
      console.error('Failed to update asset type:', error)
      setError('Error updating asset type')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteType = async () => {
    if (!selectedType) return

    setCreating(true)
    setError('')
    try {
      const res = await fetch(`/api/asset-types/${selectedType.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setTypes(types.filter(t => t.id !== selectedType.id))
        setShowDeleteModal(false)
        setSelectedType(null)
        setSuccess(`Asset type deleted successfully`)
        setTimeout(() => setSuccess(''), 4000)
      } else {
        setError('Failed to delete asset type')
      }
    } catch (error) {
      console.error('Failed to delete asset type:', error)
      setError('Error deleting asset type')
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
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Actions</th>
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
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedType(type)
                            setFormData({ name: type.name, code: type.code })
                            setShowEditForm(true)
                          }}
                          className="text-xs font-medium px-2 py-1 rounded transition text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedType(type)
                            setShowDeleteModal(true)
                          }}
                          className="text-xs font-medium px-2 py-1 rounded transition text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          Delete
                        </button>
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

      {/* Edit Type Modal */}
      {showEditForm && selectedType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Edit Asset Type</h2>
            </div>

            <form onSubmit={handleEditType} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  maxLength={5}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {creating ? 'Updating...' : 'Update Type'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false)
                    setSelectedType(null)
                    setFormData({ name: '', code: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Type Modal */}
      {showDeleteModal && selectedType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Delete Asset Type</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete asset type <strong>{selectedType.name}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This will only delete the type definition. Existing assets of this type will remain in the system.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedType(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteType}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {creating ? 'Deleting...' : 'Delete Type'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutWrapper>
  )
}
