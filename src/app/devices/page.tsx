'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { SkeletonGrid } from '@/components/SkeletonLoader'
import { AuthUser } from '@/types/auth'

export default function MyDevicesPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [devices, setDevices] = useState<any[]>([])
  const [selectedDevice, setSelectedDevice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [returning, setReturning] = useState(false)
  const [returnMessage, setReturnMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

        // Get assets assigned to this user
        const assetsRes = await fetch('/api/my-assets', { credentials: 'include' })
        const { assets = [] } = await assetsRes.json()
        setDevices(assets)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load devices:', error)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleReturnDevice = async () => {
    if (!selectedDevice) return

    if (!window.confirm(`Request to return ${selectedDevice.tag}? Admin approval required.`)) {
      return
    }

    setReturning(true)
    setReturnMessage(null)

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestType: 'Return',
          assetId: selectedDevice.id,
          notes: `Requesting to return asset: ${selectedDevice.assetTag}`,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create return request')
      }

      setSelectedDevice(null)
      setReturnMessage({ type: 'success', text: 'Return request submitted. Admin approval required.' })
      setTimeout(() => setReturnMessage(null), 3000)
    } catch (error: any) {
      setReturnMessage({ type: 'error', text: error.message || 'Failed to submit return request' })
    } finally {
      setReturning(false)
    }
  }

  if (!user) return null

  const isWarrantySoon = (warrantyEnd: string) => {
    const warranty = new Date(warrantyEnd)
    const now = new Date()
    const daysUntil = Math.ceil((warranty.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil < 90 && daysUntil > 0
  }

  const isWarrantyExpired = (warrantyEnd: string) => {
    const warranty = new Date(warrantyEnd)
    return warranty < new Date()
  }

  return (
    <LayoutWrapper user={user} pageTitle="My Devices">
      <ContentContainer>
        {/* Page Description */}
        <p className="text-sm text-gray-600 mb-6">
          {devices.length} device{devices.length !== 1 ? 's' : ''} assigned to you
        </p>
        {loading ? (
          <SkeletonGrid count={6} />
        ) : devices.length === 0 ? (
          <EmptyState
            icon="💻"
            title="No Devices Assigned"
            description="Contact your administrator to request assets"
          />
        ) : (
          <div className="fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => {
                const hasExpiredWarranty = isWarrantyExpired(device.warrantyEnd)
                const hasSoonWarranty = isWarrantySoon(device.warrantyEnd)

                return (
                  <div
                    key={device.id}
                    className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition cursor-pointer"
                    onClick={() => setSelectedDevice(device)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {device.type}
                      </span>
                      <span className="text-lg text-gray-400">→</span>
                    </div>

                    {/* Main Content */}
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{device.assetTag}</h3>
                    <p className="text-sm text-gray-600 mb-5 line-clamp-2">{device.modelName}</p>

                    {/* Device Info */}
                    <div className="space-y-3 mb-5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Serial</span>
                        <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {device.serialNum.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status</span>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Warranty Status */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-600">Warranty</span>
                        <span
                          className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{
                            background: hasExpiredWarranty
                              ? '#fee2e2'
                              : hasSoonWarranty
                              ? '#fef3c7'
                              : '#dcfce7',
                            color: hasExpiredWarranty ? '#dc2626' : hasSoonWarranty ? '#d97706' : '#16a34a',
                          }}
                        >
                          {hasExpiredWarranty ? 'Expired' : hasSoonWarranty ? 'Expiring Soon' : 'Valid'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{device.warrantyEnd}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Device Details Modal */}
      <Modal
        isOpen={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        title={selectedDevice?.assetTag || ''}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={handleReturnDevice}
              disabled={returning}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:bg-gray-400"
            >
              {returning ? 'Returning...' : 'Return Device'}
            </button>
            <button
              onClick={() => setSelectedDevice(null)}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedDevice && (
          <div className="space-y-6">
            {/* Type Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                {selectedDevice.type}
              </span>
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                Active
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Asset Tag</p>
                <p className="text-base font-semibold text-gray-900">{selectedDevice.assetTag}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Type</p>
                <p className="text-base font-semibold text-gray-900">{selectedDevice.type}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Model</p>
                <p className="text-base font-semibold text-gray-900">{selectedDevice.modelName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Serial</p>
                <p className="text-base font-mono text-gray-900 break-all">{selectedDevice.serialNum}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Status</p>
                <p className="text-base font-semibold text-green-700">{selectedDevice.status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Cost</p>
                <p className="text-base font-semibold text-gray-900">${selectedDevice.purchaseCost?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Warranty End</p>
                <p className="text-base font-semibold text-gray-900">{selectedDevice.warrantyEnd}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Allocated</p>
                <p className="text-base font-semibold text-gray-900">{selectedDevice.createdAt}</p>
              </div>
            </div>

            {/* Warranty Warning */}
            {(isWarrantyExpired(selectedDevice.warrantyEnd) || isWarrantySoon(selectedDevice.warrantyEnd)) && (
              <div
                className="p-4 rounded-lg border text-sm"
                style={{
                  background: isWarrantyExpired(selectedDevice.warrantyEnd) ? '#fee2e2' : '#fef3c7',
                  borderColor: isWarrantyExpired(selectedDevice.warrantyEnd) ? '#fecaca' : '#fcd34d',
                  color: isWarrantyExpired(selectedDevice.warrantyEnd) ? '#991b1b' : '#92400e',
                }}
              >
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {isWarrantyExpired(selectedDevice.warrantyEnd) ? 'Warranty Expired' : 'Warranty Expiring Soon'}
                </p>
                <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  {isWarrantyExpired(selectedDevice.warrantyEnd)
                    ? `Warranty expired on ${selectedDevice.warrantyEnd}`
                    : `Warranty expires on ${selectedDevice.warrantyEnd}`}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
      </ContentContainer>
    </LayoutWrapper>
  )
}
