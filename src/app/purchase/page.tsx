'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import EmptyState from '@/components/EmptyState'
import { SkeletonTable } from '@/components/SkeletonLoader'
import { AuthUser } from '@/types/auth'

interface Invoice {
  id: string
  invoiceNum: string
  vendor: string
  vendorId?: string
  totalAmount: number
  currency: string
  poNumber?: string
  createdAt: string
  createdBy?: string
  notes?: string
}

export default function InvoicesPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
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
        if (!authUser.role.toUpperCase().includes('PURCHASE') && !authUser.role.toUpperCase().includes('ADMIN')) {
          router.push('/dashboard-v2')
          return
        }
        setUser(authUser)

        const invoicesRes = await fetch('/api/invoices')
        const { invoices: fetchedInvoices } = await invoicesRes.json()
        setInvoices(fetchedInvoices)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load invoices:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (!user) return null

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

  return (
    <LayoutWrapper user={user} pageTitle="Invoices">
      <ContentContainer>
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-sm text-gray-600">View and manage received invoices</p>
          </div>
          <button
            onClick={() => router.push('/purchase/add')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + Add Invoice
          </button>
        </div>

        {/* Summary Stats */}
        {!loading && invoices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Average</p>
              <p className="text-3xl font-bold text-gray-900">${(totalAmount / invoices.length).toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        {loading ? (
          <SkeletonTable rows={5} columns={6} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No Invoices Yet"
            description="Start by adding your first invoice"
            action={{ label: '+ Add Invoice', onClick: () => router.push('/purchase/add') }}
          />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Invoice History</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{invoices.length} invoices</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Invoice #</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Vendor</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">PO Number</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Created By</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">{inv.invoiceNum}</td>
                      <td className="px-6 py-4 text-gray-700">{inv.vendor}</td>
                      <td className="px-6 py-4 text-gray-700">{inv.poNumber || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {inv.currency} ${inv.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{inv.createdBy || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{inv.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ContentContainer>
    </LayoutWrapper>
  )
}
