'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import EmptyState from '@/components/EmptyState'
import { SkeletonTable } from '@/components/SkeletonLoader'
import { AuthUser } from '@/types/auth'

interface Asset {
  id: string
  tag: string
  type: string
  name: string
  manufacturer?: string
  serialNum: string
  status: string
  condition?: string
  holder?: { id: string; name: string; email: string }
  location?: string
  purchaseCost?: number
  warrantyStart?: string
  warrantyEnd?: string
  createdAt?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function InventoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [assetTypes, setAssetTypes] = useState<string[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [allocating, setAllocating] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returning, setReturning] = useState(false)

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

        const [assetsRes, typesRes, usersRes] = await Promise.all([
          fetch('/api/assets'),
          fetch('/api/asset-types'),
          fetch('/api/users'),
        ])

        const { assets: fetchedAssets } = await assetsRes.json()
        const { types = [] } = await typesRes.json()
        const { users: fetchedUsers } = await usersRes.json()

        setAssets(fetchedAssets)
        setAssetTypes(types.map((t: any) => t.name))
        setAllUsers(fetchedUsers || [])
        setLoading(false)
      } catch (error) {
        console.error('Failed to load inventory:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleAllocateClick = (asset: Asset) => {
    if (asset.status !== 'Available') {
      alert('Can only allocate Available assets')
      return
    }
    setSelectedAsset(asset)
    setSelectedUserId('')
    setShowAllocateModal(true)
  }

  const handleAllocate = async () => {
    if (!selectedAsset || !selectedUserId) return

    setAllocating(true)
    try {
      const res = await fetch(`/api/assets/${selectedAsset.id}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toUserId: selectedUserId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to allocate asset')
      }

      // Update asset in list
      setAssets(
        assets.map((a) =>
          a.id === selectedAsset.id
            ? { ...a, status: 'Assigned', holder: allUsers.find((u) => u.id === selectedUserId) as any }
            : a
        )
      )

      setShowAllocateModal(false)
      setSelectedAsset(null)
      setSelectedUserId('')
      alert('Asset allocated successfully')
    } catch (error: any) {
      alert(error.message || 'Failed to allocate asset')
    } finally {
      setAllocating(false)
    }
  }

  const handleReturnAsset = async () => {
    if (!selectedAsset) return

    setReturning(true)
    try {
      const res = await fetch(`/api/assets/${selectedAsset.id}/deallocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: 'Admin manual return' }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to return asset')
      }

      // Update asset in list
      setAssets(
        assets.map((a) =>
          a.id === selectedAsset.id
            ? { ...a, status: 'Available', holder: undefined }
            : a
        )
      )

      setShowReturnModal(false)
      setSelectedAsset(null)
      alert('Asset returned to inventory successfully')
    } catch (error: any) {
      alert(error.message || 'Failed to return asset')
    } finally {
      setReturning(false)
    }
  }

  if (!user) return null

  const filteredAssets = assets.filter((asset) => {
    if (statusFilter && asset.status !== statusFilter) return false
    if (typeFilter && asset.type !== typeFilter) return false
    return true
  })

  const statuses = ['Available', 'Assigned', 'Repair', 'Retired', 'Disposed']
  const statusColors: Record<string, { bg: string; text: string }> = {
    Available: { bg: '#e8f5e9', text: '#2e7d32' },
    Assigned: { bg: '#e3f2fd', text: '#1565c0' },
    Repair: { bg: '#fff3e0', text: '#e65100' },
    Retired: { bg: '#eeeeee', text: '#616161' },
    Disposed: { bg: '#ffebee', text: '#d32f2f' },
  }

  return (
    <LayoutWrapper user={user} pageTitle="Inventory">
      <ContentContainer>
        <div className="mb-8">
          <p className="text-sm text-gray-600 mb-6">View and manage all IT assets</p>

          <div className="flex gap-4 mb-6 flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                {assetTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {(statusFilter || typeFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('')
                  setTypeFilter('')
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition mt-6"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={10} columns={8} />
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No assets found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#F3EDE0', borderBottom: '2px solid #E5DCD0' }}>
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Tag</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Model</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Serial</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Holder</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Location</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Warranty</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset, idx) => {
                    const colors = statusColors[asset.status] || { bg: '#f5f5f5', text: '#666' }
                    return (
                      <tr
                        key={asset.id}
                        style={{
                          borderBottom: '1px solid #E5DCD0',
                          background: idx % 2 === 0 ? '#FFFFFF' : '#F9F7F4',
                        }}
                        className="hover:bg-gray-50 transition cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">{asset.tag}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{asset.type}</td>
                        <td className="px-6 py-4 text-gray-700 text-xs">{asset.name || '-'}</td>
                        <td className="px-6 py-4 text-gray-700 text-xs">{asset.serialNum}</td>
                        <td className="px-6 py-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background: colors.bg, color: colors.text }}
                          >
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {asset.holder ? (
                            <div className="text-sm">
                              <p className="font-medium">{asset.holder.name}</p>
                              <p className="text-xs text-gray-500">{asset.holder.email}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm">{asset.location || '-'}</td>
                        <td className="px-6 py-4 text-gray-700 text-xs">
                          {asset.warrantyEnd ? (
                            <span>{asset.warrantyEnd}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          {asset.status === 'Available' && (
                            <button
                              onClick={() => handleAllocateClick(asset)}
                              className="px-3 py-1 text-xs font-medium text-white rounded hover:opacity-80 transition"
                              style={{ background: '#E51837' }}
                            >
                              Allocate
                            </button>
                          )}
                          {asset.status === 'Assigned' && (
                            <button
                              onClick={() => {
                                setSelectedAsset(asset)
                                setShowReturnModal(true)
                              }}
                              className="px-3 py-1 text-xs font-medium text-white rounded hover:opacity-80 transition bg-orange-600"
                            >
                              Return
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && filteredAssets.length > 0 && (
          <div className="mt-6 text-sm text-gray-600">
            Showing {filteredAssets.length} of {assets.length} assets
          </div>
        )}
      </ContentContainer>

      {/* Allocate Modal */}
      {showAllocateModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Allocate Asset</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedAsset.tag}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Assign to User *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                >
                  <option value="">-- Select User --</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowAllocateModal(false)
                  setSelectedAsset(null)
                  setSelectedUserId('')
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocate}
                disabled={!selectedUserId || allocating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {allocating ? 'Allocating...' : 'Allocate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Asset Modal */}
      {showReturnModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Return Asset to Inventory</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedAsset.tag}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Holder:</strong> {selectedAsset.holder?.name || 'Unknown'}<br/>
                  <strong>Email:</strong> {selectedAsset.holder?.email || 'N/A'}
                </p>
              </div>
              <p className="text-sm text-gray-700">
                This will return <strong>{selectedAsset.tag}</strong> to Available status in inventory.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowReturnModal(false)
                  setSelectedAsset(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnAsset}
                disabled={returning}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition disabled:bg-gray-400"
              >
                {returning ? 'Returning...' : 'Return to Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutWrapper>
  )
}
