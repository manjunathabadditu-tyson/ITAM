'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Asset {
  id: string
  tag: string
  serialNumber: string
  type: string
  name: string
  status: string
  currentHolder?: { name: string } | null
  location?: { name: string } | null
  warrantEnd?: string | null
  purchaseDate?: string | null
}

interface AssetGridProps {
  assets: Asset[]
  onAllocate?: (assetId: string) => void
  onDeallocate?: (assetId: string) => void
  loading?: boolean
}

type SortField = 'tag' | 'type' | 'status' | 'currentHolder' | 'warrantEnd'
type SortOrder = 'asc' | 'desc'

export default function AssetGrid({
  assets,
  onAllocate,
  onDeallocate,
  loading,
}: AssetGridProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('tag')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Filter and search
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const searchLower = search.toLowerCase()
      return (
        asset.tag.toLowerCase().includes(searchLower) ||
        asset.serialNumber?.toLowerCase().includes(searchLower) ||
        asset.type?.toLowerCase().includes(searchLower) ||
        asset.name?.toLowerCase().includes(searchLower) ||
        asset.currentHolder?.name.toLowerCase().includes(searchLower)
      )
    })
  }, [assets, search])

  // Sort
  const sortedAssets = useMemo(() => {
    const sorted = [...filteredAssets].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (sortField === 'currentHolder') {
        aVal = a.currentHolder?.name || ''
        bVal = b.currentHolder?.name || ''
      } else if (sortField === 'warrantEnd') {
        aVal = a.warrantEnd ? new Date(a.warrantEnd).getTime() : 0
        bVal = b.warrantEnd ? new Date(b.warrantEnd).getTime() : 0
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredAssets, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(new Set(sortedAssets.map((a) => a.id)))
    } else {
      setSelectedAssets(new Set())
    }
  }

  const handleSelectAsset = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedAssets)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedAssets(newSelected)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return { bg: '#e8f5e9', text: '#2e7d32' }
      case 'Assigned':
        return { bg: '#e3f2fd', text: '#1565c0' }
      case 'Repair':
        return { bg: '#fff3e0', text: '#e65100' }
      case 'Retired':
        return { bg: '#f5f5f5', text: '#616161' }
      case 'Disposed':
        return { bg: '#ffebee', text: '#d32f2f' }
      default:
        return { bg: '#f0f0f0', text: '#616161' }
    }
  }

  const isWarrantyExpiring = (warrantyEnd?: string | null) => {
    if (!warrantyEnd) return false
    const daysUntilExpiry = Math.floor(
      (new Date(warrantyEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">⇅</span>
    }
    return sortOrder === 'asc' ? <span>↑</span> : <span>↓</span>
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        Loading assets...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Bulk Actions */}
      <div className="flex gap-4 items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by tag, serial, model, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>

        {selectedAssets.size > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">
              {selectedAssets.size} selected
            </span>
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Bulk Actions ▼
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions Dropdown */}
      {showBulkActions && selectedAssets.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            Allocate ({selectedAssets.size})
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            Deallocate ({selectedAssets.size})
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            Send to Repair ({selectedAssets.size})
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedAssets.size === sortedAssets.length && sortedAssets.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort('tag')}
                >
                  <span className="flex items-center gap-2">
                    Asset Tag <SortIcon field="tag" />
                  </span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Serial
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort('status')}
                >
                  <span className="flex items-center gap-2">
                    Status <SortIcon field="status" />
                  </span>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort('currentHolder')}
                >
                  <span className="flex items-center gap-2">
                    Current Holder <SortIcon field="currentHolder" />
                  </span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Location
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleSort('warrantEnd')}
                >
                  <span className="flex items-center gap-2">
                    Warranty End <SortIcon field="warrantEnd" />
                  </span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No assets found
                  </td>
                </tr>
              ) : (
                sortedAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className={`hover:bg-gray-50 transition ${
                      selectedAssets.has(asset.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedAssets.has(asset.id)}
                        onChange={(e) => handleSelectAsset(asset.id, e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-semibold text-gray-900">{asset.tag}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{asset.name}</td>
                    <td className="px-6 py-3 text-gray-600 text-sm font-mono">
                      {asset.serialNumber}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: getStatusColor(asset.status).bg,
                          color: getStatusColor(asset.status).text,
                        }}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {asset.currentHolder?.name || '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {asset.location?.name || '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-sm ${
                          isWarrantyExpiring(asset.warrantEnd)
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-600'
                        }`}
                      >
                        {asset.warrantEnd
                          ? new Date(asset.warrantEnd).toLocaleDateString()
                          : '—'}
                        {isWarrantyExpiring(asset.warrantEnd) && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            router.push(`/inventory/${asset.id}`)
                          }
                          className="text-xs font-medium text-primary hover:text-primary-dark"
                        >
                          View
                        </button>
                        {asset.status === 'Available' && onAllocate && (
                          <button
                            onClick={() => onAllocate(asset.id)}
                            className="text-xs font-medium text-green-600 hover:text-green-700"
                          >
                            Allocate
                          </button>
                        )}
                        {asset.status === 'Assigned' && onDeallocate && (
                          <button
                            onClick={() => onDeallocate(asset.id)}
                            className="text-xs font-medium text-orange-600 hover:text-orange-700"
                          >
                            Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing <strong>{sortedAssets.length}</strong> of{' '}
        <strong>{assets.length}</strong> assets
      </div>
    </div>
  )
}
