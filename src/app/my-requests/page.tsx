'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import EmptyState from '@/components/EmptyState'
import { SkeletonTable } from '@/components/SkeletonLoader'
import { AuthUser } from '@/types/auth'

interface Request {
  id: string
  requestType: string
  status: string
  requestedBy: string
  requestedByUser?: { name: string }
  notes?: string
  createdAt: string
  approvalDate?: string
  rejectionDate?: string
}

export default function MyRequestsPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

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

        // Fetch requests from database
        const requestsRes = await fetch('/api/requests', { credentials: 'include' })
        const { requests: fetchedRequests } = await requestsRes.json()
        setRequests(fetchedRequests || [])
        setLoading(false)
      } catch (error) {
        console.error('Failed to load requests:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (!user || loading) return null

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return { bg: '#fef3c7', text: '#92400e' }
      case 'Approved':
        return { bg: '#d1fae5', text: '#065f46' }
      case 'Rejected':
        return { bg: '#fee2e2', text: '#7f1d1d' }
      case 'Fulfilled':
        return { bg: '#dbeafe', text: '#0c4a6e' }
      default:
        return { bg: '#f3f4f6', text: '#374151' }
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Allocate':
        return { bg: '#dbeafe', text: '#0c4a6e' }
      case 'Return':
        return { bg: '#fce7f3', text: '#831843' }
      case 'Issue':
        return { bg: '#e0e7ff', text: '#312e81' }
      case 'New':
        return { bg: '#d1fae5', text: '#065f46' }
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
      })
    } catch {
      return dateStr
    }
  }

  const statuses = ['all', 'Open', 'Approved', 'Rejected', 'Fulfilled']

  return (
    <LayoutWrapper user={user} pageTitle="My Requests">
      <ContentContainer>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-gray-600">Track your asset requests and their status</p>
          </div>
          <button
            onClick={() => router.push('/request-asset')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + Request Asset
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All Requests' : status}
            </button>
          ))}
        </div>

        {/* Requests Table */}
        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No Requests Yet"
            description="Submit your first asset request to get started"
            action={{ label: '+ Request Asset', onClick: () => router.push('/request-asset') }}
          />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Request History</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{filteredRequests.length} requests</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Submitted</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => {
                    const statusColors = getStatusColor(request.status)
                    const typeColors = getTypeColor(request.requestType)
                    return (
                      <tr key={request.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
                          >
                            {request.requestType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(request.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          <div className="line-clamp-2 text-xs">
                            {request.notes ? request.notes.substring(0, 100) + '...' : '-'}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ContentContainer>
    </LayoutWrapper>
  )
}
