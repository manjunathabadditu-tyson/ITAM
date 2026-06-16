'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import { AuthUser } from '@/types/auth'

export default function AddPurchasePage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    invoiceNum: '',
    vendorId: '',
    poNumber: '',
    totalAmount: '',
    currency: 'USD',
    notes: '',
  })

  const [vendors, setVendors] = useState<any[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const { user: authUser } = await res.json()
        if (!authUser) {
          router.push('/login')
          return
        }
        // Check if user has PURCHASE or ADMIN role
        if (!authUser.role.toUpperCase().includes('PURCHASE') && !authUser.role.toUpperCase().includes('ADMIN')) {
          router.push('/dashboard-v2')
          return
        }
        setUser(authUser)

        // Fetch vendors
        const vendorsRes = await fetch('/api/vendors')
        const { vendors: fetchedVendors } = await vendorsRes.json()
        setVendors(fetchedVendors || [])
        setLoading(false)
      } catch (error) {
        console.error('Failed to load data:', error)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.invoiceNum || !formData.totalAmount) {
      setError('Invoice number and amount are required')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNum: formData.invoiceNum,
          vendorId: formData.vendorId || null,
          poNumber: formData.poNumber || null,
          totalAmount: parseFloat(formData.totalAmount) || 0,
          currency: formData.currency,
          notes: formData.notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create invoice')
      }

      setSuccess('Invoice created successfully!')
      setFormData({
        invoiceNum: '',
        vendorId: '',
        poNumber: '',
        totalAmount: '',
        currency: 'USD',
        notes: '',
      })
      setTimeout(() => router.push('/purchase'), 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || loading) return null

  return (
    <LayoutWrapper user={user} pageTitle="Add Purchase">
      <ContentContainer>
        <p className="text-sm text-gray-600 mb-8">Create a new purchase invoice</p>

        <div className="max-w-2xl bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Invoice Number *</label>
              <input
                type="text"
                value={formData.invoiceNum}
                onChange={(e) => setFormData({ ...formData, invoiceNum: e.target.value })}
                placeholder="INV-2026-001"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Vendor (Optional)</label>
              <select
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a vendor --</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PO Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">PO Number (Optional)</label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                placeholder="PO-2026-001"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Total Amount */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Amount *</label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this invoice..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 font-medium">{success}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {submitting ? 'Creating...' : 'Create Invoice'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/purchase')}
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </ContentContainer>
    </LayoutWrapper>
  )
}
