'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import Alert from '@/components/Alert'
import { AuthUser } from '@/types/auth'

interface AssetType {
  id: string
  name: string
  code: string
}

export default function RequestAssetPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    requestType: 'New',
    assetTypeId: '',
    quantity: '1',
    justification: '',
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const { user: authUser } = await res.json()
        if (!authUser) {
          router.push('/login')
          return
        }
        setUser(authUser)

        // Fetch asset types
        const typesRes = await fetch('/api/asset-types')
        const { types = [] } = await typesRes.json()
        setAssetTypes(types)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load page:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.assetTypeId || !formData.justification.trim()) {
      setError('Asset type and justification are required')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestType: formData.requestType,
          assetId: null,
          notes: `Asset Type: ${assetTypes.find(t => t.id === formData.assetTypeId)?.name || 'Unknown'}\nQuantity: ${formData.quantity}\nJustification: ${formData.justification}`,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create request')
      }

      setSuccess('Asset request submitted successfully! You can view it in "My Requests"')
      setFormData({
        requestType: 'New',
        assetTypeId: '',
        quantity: '1',
        justification: '',
      })
      setTimeout(() => router.push('/my-requests'), 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || loading) return null

  return (
    <LayoutWrapper user={user} pageTitle="Request Asset">
      <ContentContainer>
        <p className="text-sm text-gray-600 mb-8">Submit a request for new assets</p>

        <div className="max-w-2xl bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Request Type *</label>
              <select
                value={formData.requestType}
                onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="New">New Asset - Request a brand new asset to be purchased</option>
                <option value="Allocate">Asset Allocation - Request an existing available asset</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                <strong>New Asset:</strong> Request approval to purchase a new item (e.g., new laptop model)
                <br />
                <strong>Asset Allocation:</strong> Request an existing asset from inventory be assigned to you
              </p>
            </div>

            {/* Asset Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Asset Type *</label>
              <select
                value={formData.assetTypeId}
                onChange={(e) => setFormData({ ...formData, assetTypeId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Asset Type --</option>
                {assetTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Choose the type of asset you need</p>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Justification */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Justification *</label>
              <textarea
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                placeholder="Explain why you need this asset and how it will be used..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Provide details to help admins process your request</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 font-medium">{success}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/my-requests')}
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </ContentContainer>
    </LayoutWrapper>
  )
}
