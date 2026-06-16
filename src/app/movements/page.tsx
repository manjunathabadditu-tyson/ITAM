'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import { SkeletonTable } from '@/components/SkeletonLoader'
import { AuthUser } from '@/types/auth'

interface Movement {
  id: string
  assetId: string
  assetTag: string
  action: string
  fromStatus?: string
  toStatus: string
  fromUser?: { name: string }
  toUser?: { name: string }
  performedBy: { name: string }
  performedAt: string
  notes?: string
}

export default function MovementsPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const { user: authUser } = await res.json()
        if (!authUser || (!authUser.role.includes('ADMIN') && !authUser.role.includes('PURCHASE'))) {
          router.push('/dashboard')
          return
        }
        setUser(authUser)

        // Fetch movements from database
        const movementsRes = await fetch('/api/asset-movements')
        const { movements: fetchedMovements } = await movementsRes.json()
        setMovements(fetchedMovements || [])
        setLoading(false)
      } catch (error) {
        console.error('Failed to load movements:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (!user || loading) return null

  const filteredMovements = filter === 'all'
    ? movements
    : movements.filter(m => m.action === filter)

  const getActionColor = (action: string) => {
    switch (action) {
      case 'StockIn':
        return { bg: '#d1fae5', text: '#065f46' }
      case 'Allocate':
        return { bg: '#dbeafe', text: '#0c4a6e' }
      case 'Deallocate':
        return { bg: '#fef3c7', text: '#92400e' }
      case 'Transfer':
        return { bg: '#e0e7ff', text: '#312e81' }
      case 'Repair':
        return { bg: '#fecaca', text: '#7c2d12' }
      case 'RepairComplete':
        return { bg: '#c7d2fe', text: '#312e81' }
      case 'Retire':
        return { bg: '#f3e8ff', text: '#5b21b6' }
      case 'Dispose':
        return { bg: '#fee2e2', text: '#7f1d1d' }
      default:
        return { bg: '#f3f4f6', text: '#374151' }
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const uniqueActions = ['all', ...new Set(movements.map(m => m.action))]

  return (
    <LayoutWrapper user={user} pageTitle="Asset Movement">
      <ContentContainer>
        <p className="text-sm text-gray-600 mb-6">Track all asset movements and transactions</p>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {uniqueActions.map(action => (
            <button
              key={action}
              onClick={() => setFilter(action)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === action
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {action === 'all' ? 'All Movements' : action}
            </button>
          ))}
        </div>

        {/* Movements Table */}
        {loading ? (
          <SkeletonTable />
        ) : movements.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 font-medium mb-2">No asset movements yet</p>
            <p className="text-sm text-gray-500">Asset movements will appear here as assets are allocated and transferred</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">To</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Performed By</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.map(movement => {
                  const colors = getActionColor(movement.action)
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{movement.assetTag}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {movement.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {movement.fromUser?.name || movement.fromStatus || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {movement.toUser?.name || movement.toStatus || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{movement.performedBy?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(movement.performedAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{movement.notes || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </ContentContainer>
    </LayoutWrapper>
  )
}
