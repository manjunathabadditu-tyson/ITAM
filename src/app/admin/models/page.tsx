'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import Modal from '@/components/Modal'
import { AuthUser } from '@/types/auth'

interface AssetModel {
  id: string
  name: string
  assetTypeId: string
  type: string
  manufacturer?: string
}

interface AssetType {
  id: string
  name: string
}

interface Vendor {
  id: string
  name: string
}

export default function ModelsPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [models, setModels] = useState<AssetModel[]>([])
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    assetTypeId: '',
    vendorId: '',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const authRes = await fetch('/api/auth/me', { credentials: 'include' })
        const { user: authUser } = await authRes.json()

        if (!authUser) {
          router.push('/login')
          return
        }
        if (!authUser.role.includes('ADMIN')) {
          router.push('/dashboard')
          return
        }
        setUser(authUser)

        const [modelsRes, typesRes, vendorsRes] = await Promise.all([
          fetch('/api/asset-names'),
          fetch('/api/asset-types'),
          fetch('/api/vendors'),
        ])

        const { names: fetchedModels } = await modelsRes.json()
        const { types: fetchedTypes } = await typesRes.json()
        const { vendors: fetchedVendors } = await vendorsRes.json()

        setModels(fetchedModels)
        setAssetTypes(fetchedTypes)
        setVendors(fetchedVendors || [])
        setLoading(false)
      } catch (error) {
        console.error('Failed to load data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleAddModel = async () => {
    if (!formData.name || !formData.assetTypeId) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const vendorName = formData.vendorId
        ? vendors.find((v) => v.id === formData.vendorId)?.name
        : undefined

      const res = await fetch('/api/asset-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          assetTypeId: formData.assetTypeId,
          manufacturer: vendorName || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create model')
      }

      const newModel = await res.json()
      setModels([...models, newModel])
      setMessage({ type: 'success', text: 'Model created successfully' })
      setFormData({ name: '', assetTypeId: '', vendorId: '' })
      setShowAddModal(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || loading) return null

  const filteredModels = typeFilter
    ? models.filter((m) => m.assetTypeId === typeFilter)
    : models

  return (
    <LayoutWrapper user={user} pageTitle="Asset Models">
      <ContentContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Asset Models</h1>
              <p className="text-gray-600">Manage models and vendors for each asset type</p>
            </div>
            <button
              onClick={() => {
                setFormData({ name: '', assetTypeId: '', vendorId: '' })
                setShowAddModal(true)
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium"
            >
              + Add Model
            </button>
          </div>

          {message && (
            <div
              className={`px-4 py-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Filter by Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="">All Types</option>
              {assetTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              Loading models...
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              No models found
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Model Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Asset Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vendor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredModels.map((model) => (
                    <tr key={model.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3">
                        <span className="font-medium text-gray-900">{model.name}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-700">{model.type}</td>
                      <td className="px-6 py-3 text-gray-600">{model.manufacturer || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ContentContainer>

      {showAddModal && (
        <Modal
          title="Add New Model"
          onClose={() => {
            setShowAddModal(false)
            setFormData({ name: '', assetTypeId: '', vendorId: '' })
            setMessage(null)
          }}
          actions={[
            {
              label: 'Cancel',
              onClick: () => {
                setShowAddModal(false)
                setFormData({ name: '', assetTypeId: '', vendorId: '' })
                setMessage(null)
              },
            },
            {
              label: 'Create Model',
              onClick: handleAddModel,
              variant: 'primary',
              disabled: submitting || !formData.name || !formData.assetTypeId,
            },
          ]}
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Model Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                placeholder="e.g., Dell XPS 13"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Asset Type *</label>
              <select
                value={formData.assetTypeId}
                onChange={(e) => setFormData({ ...formData, assetTypeId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                required
              >
                <option value="">-- Select Type --</option>
                {assetTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Vendor (Optional)</label>
              <select
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="">-- No Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </LayoutWrapper>
  )
}
