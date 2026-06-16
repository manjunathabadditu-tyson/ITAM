'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import { SkeletonStatCards, SkeletonCard } from '@/components/SkeletonLoader'
import { AuthUser } from '@/types/auth'

interface DashboardData {
  counts: {
    total: number
    available: number
    assigned: number
  }
  assetsByType: Array<{ type: string; count: number }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

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

        // Fetch assets from database
        const assetsRes = await fetch('/api/assets')
        const { assets = [] } = await assetsRes.json()

        // Calculate counts
        const counts = {
          total: assets.length,
          available: assets.filter((a: any) => a.status === 'Available').length,
          assigned: assets.filter((a: any) => a.status === 'Assigned').length,
        }

        // Group by type
        const typeMap = new Map<string, number>()
        assets.forEach((a: any) => {
          const count = typeMap.get(a.type) || 0
          typeMap.set(a.type, count + 1)
        })

        const assetsByType = Array.from(typeMap.entries()).map(([type, count]) => ({
          type,
          count,
        }))

        setData({ counts, assetsByType })
        setLoading(false)
      } catch (error) {
        console.error('Failed to load dashboard:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (!user) return null

  return (
    <LayoutWrapper user={user} pageTitle="Dashboard">
      <ContentContainer>
        {/* Page Description */}
        <p className="text-sm text-gray-600 mb-8">Asset inventory overview</p>
        {loading || !data ? (
          <div className="space-y-8">
            <SkeletonStatCards />
            <SkeletonCard count={1} />
          </div>
        ) : (
          <div className="space-y-8 fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Assets */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Assets</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{data.counts.total}</p>
                <div className="h-1 w-8 bg-gray-300 rounded-full"></div>
              </div>

              {/* Available */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Available</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{data.counts.available}</p>
                <div className="h-1 w-8 bg-green-600 rounded-full"></div>
              </div>

              {/* Assigned */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Assigned</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{data.counts.assigned}</p>
                <div className="h-1 w-8 bg-blue-600 rounded-full"></div>
              </div>
            </div>

            {/* Assets by Type */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Assets by Type</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{data.assetsByType.length} types</span>
              </div>

              {data.assetsByType.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No assets yet</p>
              ) : (
                <div className="space-y-5">
                  {data.assetsByType.map((item, idx) => {
                    const percentage = (item.count / data.counts.total) * 100
                    const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#0891b2', '#ea580c']
                    return (
                      <div key={item.type}>
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.type}</p>
                            <p className="text-xs text-gray-500">{item.count} item{item.count !== 1 ? 's' : ''}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{Math.round(percentage)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              background: colors[idx % colors.length],
                              width: `${percentage}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </ContentContainer>
    </LayoutWrapper>
  )
}
