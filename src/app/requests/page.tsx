'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import { SkeletonTable } from '@/components/SkeletonLoader'
import { AuthUser } from '@/types/auth'

interface Request {
  id: string
  requestType: string
  status: string
  requestedBy: { name: string }
  forUser?: { name: string }
  assetId?: string
  notes?: string
  createdAt: string
}

export default function RequestsPage() {
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
        const requestsRes = await fetch('/api/requests')
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

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter)

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
    <LayoutWrapper user={user} pageTitle="Requests">
      <ContentContainer>
        <p className="text-sm text-gray-600 mb-6">Manage asset allocation and return requests</p>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {statuses.map(status => (
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
          <SkeletonTable />
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 font-medium mb-2">No requests yet</p>
            <p className="text-sm text-gray-500">Asset requests will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">For User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.map(request => {
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
                      <td className="px-6 py-4 text-sm text-gray-600">{request.requestedBy?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{request.forUser?.name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(request.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{request.notes || '-'}</td>
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
