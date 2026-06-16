'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import { AuthUser } from '@/types/auth'

interface DashboardSummary {
  counts: {
    total: number
    Available: number
    Assigned: number
    Repair: number
    Retired: number
    Disposed: number
  }
  warrantyAlerts: number
  recentMovements: Array<{
    id: string
    asset: { tag: string; type: string }
    action: string
    assignedTo?: { name: string; email: string } | null
    fromUser?: { name: string } | null
    performedAt: string
  }>
}

interface AssetsByType {
  type: string
  total: number
  available: number
  assigned: number
}

export default function DashboardV2() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [assetsByType, setAssetsByType] = useState<AssetsByType[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'status' | 'type' | null>(null)
  const [filterValue, setFilterValue] = useState('')
  const [assetTypes, setAssetTypes] = useState<string[]>([])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userRes = await fetch('/api/auth/me', { credentials: 'include' })
        const { user: authUser } = await userRes.json()
        if (!authUser) {
          router.push('/login')
          return
        }
        setUser(authUser)

        // If user is not admin, redirect to My Devices
        if (!authUser.role.toUpperCase().includes('ADMIN')) {
          router.push('/devices')
          return
        }

        // Load asset types for filter dropdown
        const assetTypesRes = await fetch('/api/asset-types')
        const { types = [] } = await assetTypesRes.json()
        setAssetTypes(types.map((t: any) => t.name))

        // Build query params for filter
        let summaryUrl = '/api/dashboard/summary'
        let assetsByTypeUrl = '/api/dashboard/assets-by-type'

        if (filterType === 'status' && filterValue) {
          summaryUrl += `?filterType=status&filterValue=${encodeURIComponent(filterValue)}`
          assetsByTypeUrl += `?status=${encodeURIComponent(filterValue)}`
        } else if (filterType === 'type' && filterValue) {
          summaryUrl += `?filterType=type&filterValue=${encodeURIComponent(filterValue)}`
        }

        const [summaryRes, typesRes] = await Promise.all([
          fetch(summaryUrl),
          fetch(assetsByTypeUrl),
        ])

        const summaryData = await summaryRes.json()
        const typesData = await typesRes.json()

        setSummary(summaryData)
        setAssetsByType(typesData)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load dashboard:', error)
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router, filterType, filterValue])

  if (!user) return null

  const getAssetIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      Laptop: '💻',
      Monitor: '🖥️',
      Keyboard: '⌨️',
      Mouse: '🖱️',
      Headset: '🎧',
      Printer: '🖨️',
      Router: '📡',
      Server: '🖲️',
      Tablet: '📱',
      Phone: '☎️',
    }
    return iconMap[type] || '📦'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <LayoutWrapper user={user} pageTitle="Dashboard">
      <ContentContainer>
        {loading || !summary ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-24 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Device Type Grid - Like the screenshot */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Asset Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Available', value: summary.counts.Available, color: '#2e7d32', icon: '✓' },
                  { label: 'Assigned', value: summary.counts.Assigned, color: '#1565c0', icon: '👤' },
                  { label: 'In Repair', value: summary.counts.Repair, color: '#e65100', icon: '🔧' },
                  { label: 'Retired', value: summary.counts.Retired, color: '#616161', icon: '◯' },
                  { label: 'Disposed', value: summary.counts.Disposed, color: '#d32f2f', icon: '✕' },
                  { label: 'Total', value: summary.counts.total, color: '#E51837', icon: '📊' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push('/inventory')}
                    className="p-4 rounded-lg transition hover:shadow-md hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}25 100%)`,
                      borderLeft: `4px solid ${item.color}`,
                    }}
                  >
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className="text-2xl font-bold" style={{ color: item.color }}>
                      {item.value}
                    </div>
                    <div className="text-xs font-medium" style={{ color: item.color }}>
                      {item.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Critical Alerts */}
            {(summary.warrantyAlerts > 0 || summary.counts.Repair > 0) && (
              <div className="space-y-3">
                {summary.warrantyAlerts > 0 && (
                  <div
                    className="p-5 rounded-lg border-l-4 flex items-center justify-between"
                    style={{
                      background: '#FEE8EB',
                      borderLeftColor: '#E51837',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">⚠️</div>
                      <div>
                        <p className="font-semibold" style={{ color: '#78082A' }}>
                          {summary.warrantyAlerts} Assets with Expiring Warranty
                        </p>
                        <p className="text-sm" style={{ color: '#5A5A5A' }}>
                          Action required within 30 days
                        </p>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 rounded font-medium transition hover:opacity-80"
                      style={{
                        background: '#E51837',
                        color: '#FFFFFF',
                      }}
                    >
                      Review
                    </button>
                  </div>
                )}

                {summary.counts.Repair > 0 && (
                  <div
                    className="p-5 rounded-lg border-l-4 flex items-center justify-between"
                    style={{
                      background: '#FFF3E0',
                      borderLeftColor: '#e65100',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">🔧</div>
                      <div>
                        <p className="font-semibold" style={{ color: '#bf360c' }}>
                          {summary.counts.Repair} Assets in Repair
                        </p>
                        <p className="text-sm" style={{ color: '#5A5A5A' }}>
                          Monitor repair status and expected returns
                        </p>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 rounded font-medium transition hover:opacity-80"
                      style={{
                        background: '#e65100',
                        color: '#FFFFFF',
                      }}
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Assets by Type - Card Grid */}
            {assetsByType.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Asset Inventory by Type
                  </h2>
                  <div className="flex gap-3 items-center">
                    <select
                      value={filterType === 'status' ? filterValue : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setFilterType('status')
                          setFilterValue(e.target.value)
                        } else {
                          setFilterType(null)
                          setFilterValue('')
                        }
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">All Statuses</option>
                      <option value="Available">Available</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Repair">In Repair</option>
                      <option value="Retired">Retired</option>
                      <option value="Disposed">Disposed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
                  {assetsByType.map((item) => (
                    <div
                      key={item.type}
                      className="p-3 rounded-lg transition hover:shadow-md hover:scale-105"
                      style={{
                        background: '#F9F7F4',
                        border: '1px solid #E5DCD0',
                      }}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">{getAssetIcon(item.type)}</div>
                        <div className="text-lg font-bold text-gray-900 mb-1">{item.total}</div>
                        <h3 className="font-medium text-gray-900 text-xs mb-2 line-clamp-2">{item.type}</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-center gap-1">
                            <span
                              className="font-semibold px-1.5 py-0.5 rounded-sm"
                              style={{
                                background: '#e8f5e9',
                                color: '#2e7d32',
                              }}
                            >
                              ✓{item.available}
                            </span>
                          </div>
                          <div className="flex justify-center gap-1">
                            <span
                              className="font-semibold px-1.5 py-0.5 rounded-sm"
                              style={{
                                background: '#e3f2fd',
                                color: '#1565c0',
                              }}
                            >
                              👤{item.assigned}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Movements Table */}
            {summary.recentMovements.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  Recent Activity
                </h2>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5DCD0',
                  }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead style={{ background: '#F3EDE0', borderBottom: '2px solid #E5DCD0' }}>
                        <tr>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900">Asset</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900">Type</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900">Action</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900">Assigned To</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.recentMovements.map((movement, idx) => (
                          <tr
                            key={movement.id}
                            style={{
                              borderBottom: '1px solid #E5DCD0',
                              background: idx % 2 === 0 ? '#FFFFFF' : '#F9F7F4',
                            }}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gray-900">{movement.asset.tag}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-xs">{movement.asset.type}</td>
                            <td className="px-6 py-4">
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                  background: '#E51837',
                                  color: '#FFFFFF',
                                }}
                              >
                                {movement.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-700 text-sm">
                              {movement.assignedTo ? (
                                <div>
                                  <p className="font-medium">{movement.assignedTo.name}</p>
                                  <p className="text-xs text-gray-500">{movement.assignedTo.email}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-600 text-xs">{formatDate(movement.performedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ContentContainer>
    </LayoutWrapper>
  )
}
