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
  requestedByUser: { name: string; email: string }
  notes?: string
  createdAt: string
  approver?: { name: string }
  rejector?: { name: string }
}

export default function AdminRequestsPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Open')
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const { user: authUser } = await res.json()
        if (!authUser || !authUser.role.toUpperCase().includes('ADMIN')) {
          router.push('/dashboard-v2')
          return
        }
        setUser(authUser)
        loadRequests()
      } catch (error) {
        console.error('Failed to load:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const loadRequests = async (status = 'Open') => {
    try {
      const query = status === 'all' ? '' : `?status=${status}`
      const res = await fetch(`/api/requests/admin${query}`, { credentials: 'include' })
      if (!res.ok) {
        console.error('Failed to fetch requests:', res.status, res.statusText)
        const errorData = await res.json()
        console.error('Error data:', errorData)
        return
      }
      const data = await res.json()
      console.log('Loaded requests:', data)
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    setActioningId(id)
    try {
      const res = await fetch(`/api/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: '' }),
      })

      if (res.ok) {
        const updated = await res.json()
        setRequests(requests.map(r => r.id === id ? updated : r))
      }
    } catch (error) {
      console.error('Failed to approve:', error)
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async () => {
    if (!selectedRequestId || !rejectReason.trim()) return

    setActioningId(selectedRequestId)
    try {
      const res = await fetch(`/api/requests/${selectedRequestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason }),
      })

      if (res.ok) {
        const updated = await res.json()
        setRequests(requests.map(r => r.id === selectedRequestId ? updated : r))
        setShowRejectModal(false)
        setRejectReason('')
        setSelectedRequestId(null)
      }
    } catch (error) {
      console.error('Failed to reject:', error)
    } finally {
      setActioningId(null)
    }
  }

  if (!user) return null

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
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <LayoutWrapper user={user} pageTitle="Request Management">
      <ContentContainer>
        <p className="text-sm text-gray-600 mb-6">Review and approve/reject asset requests from users</p>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['Open', 'Approved', 'Rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilter(status)
                loadRequests(status)
              }}
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
          <SkeletonTable rows={5} columns={6} />
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 font-medium mb-2">No {filter === 'all' ? '' : filter.toLowerCase()} requests</p>
            <p className="text-sm text-gray-500">Check back later for new asset requests</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Asset Requests</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{filteredRequests.length} requests</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Requested By</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Notes</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Actions</th>
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
                          <div className="font-medium text-gray-900">{request.requestedByUser.name}</div>
                          <div className="text-xs text-gray-500">{request.requestedByUser.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          <div className="line-clamp-2 text-xs">
                            {request.notes ? request.notes.substring(0, 80) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {request.status === 'Open' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(request.id)}
                                disabled={actioningId === request.id}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded font-medium hover:bg-green-200 transition disabled:opacity-50"
                              >
                                {actioningId === request.id ? '...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequestId(request.id)
                                  setShowRejectModal(true)
                                }}
                                disabled={actioningId === request.id}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200 transition disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
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

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Request</h3>
              <p className="text-sm text-gray-600 mb-4">Provide a reason for rejecting this request</p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actioningId === selectedRequestId}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:bg-gray-400"
                >
                  {actioningId === selectedRequestId ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectReason('')
                    setSelectedRequestId(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </ContentContainer>
    </LayoutWrapper>
  )
}
