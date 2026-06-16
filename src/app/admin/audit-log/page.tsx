'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import { SkeletonTable } from '@/components/SkeletonLoader'
import { AuthUser } from '@/types/auth'

interface AuditEntry {
  id: string
  action: string
  description: string
  performedBy: { name: string }
  timestamp: string
}

export default function AuditLogPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const { user: authUser } = await res.json()
        if (!authUser || !authUser.role.includes('ADMIN')) {
          router.push('/dashboard')
          return
        }
        setUser(authUser)

        // For now, we'll fetch asset movements as a proxy for audit logs
        // In a production system, you'd have a dedicated audit log table
        const movementsRes = await fetch('/api/asset-movements')
        const { movements = [] } = await movementsRes.json()

        // Convert movements to audit log format
        const auditLogs = movements.map((m: any) => ({
          id: m.id,
          action: 'Asset Movement',
          description: `${m.action}: ${m.assetTag}`,
          performedBy: m.performedBy || { name: 'System' },
          timestamp: m.performedAt,
        }))

        setLogs(auditLogs)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load audit logs:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (!user || loading) return null

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <LayoutWrapper user={user} pageTitle="Audit Log">
      <ContentContainer>
        <p className="text-sm text-gray-600 mb-6">System activity and change log</p>

        {logs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 font-medium mb-2">No audit logs yet</p>
            <p className="text-sm text-gray-500">System activity will be logged here</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Performed By</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.performedBy?.name || 'System'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentContainer>
    </LayoutWrapper>
  )
}
