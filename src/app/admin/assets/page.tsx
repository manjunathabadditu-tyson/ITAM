'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import Modal from '@/components/Modal'
import Pagination from '@/components/Pagination'
import { AuthUser } from '@/types/auth'

interface Asset {
  id: string
  tag: string
  type: string
  name?: string
  serialNum: string
  status: string
  purchaseCost?: number
  warrantyEnd?: string
}

interface AssetType {
  id: string
  name: string
}

interface AssetName {
  id: string
  name: string
  manufacturer?: string
}

const STATUSES = ['Available', 'Assigned', 'Repair', 'Retired', 'Disposed']

export default function AssetsPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [assetNames, setAssetNames] = useState<AssetName[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalAssets, setTotalAssets] = useState(0)
  const [formData, setFormData] = useState({
    assetTag: '',
    typeId: '',
    assetNameId: '',
    serialNum: '',
    status: 'Available',
    purchaseCost: '',
    warrantyEnd: '',
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

        const offset = (currentPage - 1) * pageSize
        const [assetsRes, typesRes, namesRes] = await Promise.all([
          fetch(`/api/assets?offset=${offset}&limit=${pageSize}`),
          fetch('/api/asset-types'),
          fetch('/api/asset-names'),
        ])

        const { assets: fetchedAssets, total } = await assetsRes.json()
        const { types: fetchedTypes } = await typesRes.json()
        const { names: fetchedNames } = await namesRes.json()

        setAssets(fetchedAssets)
        setTotalAssets(total)
        setAssetTypes(fetchedTypes)
        setAssetNames(fetchedNames || [])
        setLoading(false)
      } catch (error) {
        console.error('Failed to load data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router, currentPage, pageSize])

  const handleAddAsset = async () => {
    if (!formData.assetTag || !formData.typeId || !formData.serialNum) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assetTag: formData.assetTag,
          typeId: formData.typeId,
          assetNameId: formData.assetNameId || undefined,
          serialNum: formData.serialNum,
          status: formData.status,
          purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : null,
          warrantyEnd: formData.warrantyEnd || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create asset')
      }

      const newAsset = await res.json()
      setAssets([...assets, newAsset])
      setMessage({ type: 'success', text: 'Asset created successfully' })
      setFormData({
        assetTag: '',
        typeId: '',
        assetNameId: '',
        serialNum: '',
        status: 'Available',
        purchaseCost: '',
        warrantyEnd: '',
      })
      setShowAddModal(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditAsset = async () => {
    if (!selectedAsset || !formData.assetTag || !formData.typeId || !formData.serialNum) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assetTag: formData.assetTag,
          typeId: formData.typeId,
          assetNameId: formData.assetNameId || undefined,
          serialNum: formData.serialNum,
          status: formData.status,
          purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : null,
          warrantyEnd: formData.warrantyEnd || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update asset')
      }

      const updatedAsset = await res.json()
      setAssets(
        assets.map((a) =>
          a.id === selectedAsset.id ? updatedAsset : a
        )
      )
      setMessage({ type: 'success', text: 'Asset updated successfully' })
      setShowEditModal(false)
      setSelectedAsset(null)
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return

    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete asset')
      }

      setAssets(assets.filter((a) => a.id !== selectedAsset.id))
      setMessage({ type: 'success', text: 'Asset deleted successfully' })
      setShowDeleteModal(false)
      setSelectedAsset(null)
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (asset: Asset) => {
    setSelectedAsset(asset)
    setFormData({
      assetTag: asset.tag,
      typeId: assetTypes.find(t => t.name === asset.type)?.id || '',
      assetNameId: '',
      serialNum: asset.serialNum,
      status: asset.status,
      purchaseCost: asset.purchaseCost?.toString() || '',
      warrantyEnd: asset.warrantyEnd || '',
    })
    setShowEditModal(true)
  }

  if (!user || loading) return null

  const totalPages = Math.ceil(totalAssets / pageSize)

  return (
    <LayoutWrapper user={user} pageTitle="Asset Management">
      <ContentContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Assets</h1>
              <p className="text-gray-600">Manage IT assets in inventory</p>
            </div>
            <button
              onClick={() => {
                setSelectedAsset(null)
                setFormData({
                  assetTag: '',
                  typeId: '',
                  assetNameId: '',
                  serialNum: '',
                  status: 'Available',
                  purchaseCost: '',
                  warrantyEnd: '',
                })
                setShowAddModal(true)
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              + Add Asset
            </button>
          </div>

          {/* Messages */}
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

          {/* Filters */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search by tag or serial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="">All Types</option>
              {assetTypes.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assets Table */}
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              Loading assets...
            </div>
          ) : assets.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              No assets found
            </div>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tag</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Model</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Serial</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-3">
                            <span className="font-medium text-gray-900">{asset.tag}</span>
                          </td>
                          <td className="px-6 py-3 text-gray-700">{asset.type}</td>
                          <td className="px-6 py-3 text-gray-600 text-sm">{asset.name || '-'}</td>
                          <td className="px-6 py-3 text-gray-600 text-xs font-mono">{asset.serialNum}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                asset.status === 'Available'
                                  ? 'bg-green-50 text-green-700'
                                  : asset.status === 'Assigned'
                                  ? 'bg-blue-50 text-blue-700'
                                  : asset.status === 'Repair'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {asset.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-600">
                            ${asset.purchaseCost?.toFixed(2) || 'N/A'}
                          </td>
                          <td className="px-6 py-3 flex gap-2">
                            <button
                              onClick={() => handleOpenEdit(asset)}
                              className="text-xs font-medium px-2 py-1 rounded transition text-blue-700 bg-blue-50 hover:bg-blue-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAsset(asset)
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
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalAssets}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setCurrentPage(1)
                }}
              />
            </>
          )}
        </div>
      </ContentContainer>

      {/* Add/Edit Asset Modal */}
      {(showAddModal || showEditModal) && (
        <Modal
          title={showEditModal ? `Edit Asset: ${selectedAsset?.tag}` : 'Add New Asset'}
          onClose={() => {
            showAddModal ? setShowAddModal(false) : setShowEditModal(false)
            setSelectedAsset(null)
          }}
          actions={[
            {
              label: 'Cancel',
              onClick: () => {
                showAddModal ? setShowAddModal(false) : setShowEditModal(false)
                setSelectedAsset(null)
              },
            },
            {
              label: showEditModal ? 'Update Asset' : 'Create Asset',
              onClick: showEditModal ? handleEditAsset : handleAddAsset,
              variant: 'primary',
              disabled: submitting,
            },
          ]}
        >
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Asset Tag *</label>
                <input
                  type="text"
                  value={formData.assetTag}
                  onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="e.g., LAP-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Type *</label>
                <select
                  value={formData.typeId}
                  onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
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
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Model/Name</label>
              <select
                value={formData.assetNameId}
                onChange={(e) => setFormData({ ...formData, assetNameId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="">-- Select Model --</option>
                {assetNames && assetNames.length > 0 ? (
                  assetNames.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} {n.manufacturer ? `(${n.manufacturer})` : ''}
                    </option>
                  ))
                ) : (
                  <option disabled>No models available</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Serial Number *</label>
              <input
                type="text"
                value={formData.serialNum}
                onChange={(e) => setFormData({ ...formData, serialNum: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                placeholder="e.g., ABC123456"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Purchase Cost</label>
                <input
                  type="number"
                  value={formData.purchaseCost}
                  onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Warranty End Date</label>
              <input
                type="date"
                value={formData.warrantyEnd}
                onChange={(e) => setFormData({ ...formData, warrantyEnd: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAsset && (
        <Modal
          title="Delete Asset"
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedAsset(null)
          }}
          actions={[
            {
              label: 'Cancel',
              onClick: () => {
                setShowDeleteModal(false)
                setSelectedAsset(null)
              },
            },
            {
              label: 'Delete',
              onClick: handleDeleteAsset,
              variant: 'primary',
              disabled: submitting,
            },
          ]}
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete asset <strong>{selectedAsset.tag}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> This action cannot be undone. The asset and all its history will be permanently deleted.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </LayoutWrapper>
  )
}
