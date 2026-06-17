'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/Modal'
import SearchableSelect from '@/components/SearchableSelect'

export interface AssetFormData {
  assetTag: string
  typeId: string
  assetNameId: string
  serialNum: string
  status: string
  purchaseCost: string
  warrantyEnd: string
}

interface AssetType {
  id: string
  name: string
}

interface AssetName {
  id: string
  name: string
  manufacturer?: string
  assetTypeId: string
}

const STATUSES = ['Available', 'Assigned', 'Repair', 'Retired', 'Disposed']

interface AssetFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AssetFormData) => Promise<void>
  initialData?: Partial<AssetFormData>
  isEditing?: boolean
  submitting?: boolean
}

export default function AssetFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  submitting = false,
}: AssetFormModalProps) {
  const [formData, setFormData] = useState<AssetFormData>({
    assetTag: '',
    typeId: '',
    assetNameId: '',
    serialNum: '',
    status: 'Available',
    purchaseCost: '',
    warrantyEnd: '',
    ...initialData,
  })

  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [allAssetNames, setAllAssetNames] = useState<AssetName[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [typesRes, namesRes] = await Promise.all([
          fetch('/api/asset-types'),
          fetch('/api/asset-names'),
        ])

        const { types } = await typesRes.json()
        const { names } = await namesRes.json()

        setAssetTypes(types || [])
        setAllAssetNames(names || [])
      } catch (error) {
        console.error('Failed to load form data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  // Filter models based on selected asset type
  const filteredModels = formData.typeId
    ? allAssetNames.filter((n) => n.assetTypeId === formData.typeId)
    : []

  const assetTypeOptions = assetTypes.map((t) => ({
    value: t.id,
    label: t.name,
  }))

  const modelOptions = filteredModels.map((m) => ({
    value: m.id,
    label: `${m.name}${m.manufacturer ? ` (${m.manufacturer})` : ''}`,
  }))

  const statusOptions = STATUSES.map((s) => ({
    value: s,
    label: s,
  }))

  const handleSubmit = async () => {
    if (!formData.assetTag || !formData.typeId || !formData.serialNum) {
      alert('Please fill in all required fields')
      return
    }
    await onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Asset' : 'Add New Asset'}
      actions={[
        {
          label: 'Cancel',
          onClick: onClose,
        },
        {
          label: isEditing ? 'Update Asset' : 'Create Asset',
          onClick: handleSubmit,
          variant: 'primary',
          disabled: submitting || !formData.assetTag || !formData.typeId || !formData.serialNum,
        },
      ]}
    >
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : (
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Asset Tag *</label>
              <input
                type="text"
                value={formData.assetTag}
                onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                placeholder="e.g., LAP-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Type *</label>
              <SearchableSelect
                options={assetTypeOptions}
                value={formData.typeId}
                onChange={(value) =>
                  setFormData({ ...formData, typeId: value, assetNameId: '' })
                }
                placeholder="Select Type..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Model/Name {formData.typeId && !filteredModels.length && '(No models available)'}
            </label>
            <SearchableSelect
              options={modelOptions}
              value={formData.assetNameId}
              onChange={(value) => setFormData({ ...formData, assetNameId: value })}
              placeholder="Select Model..."
              disabled={!formData.typeId || filteredModels.length === 0}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Serial Number *</label>
            <input
              type="text"
              value={formData.serialNum}
              onChange={(e) => setFormData({ ...formData, serialNum: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              placeholder="e.g., ABC123456"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
              <SearchableSelect
                options={statusOptions}
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value })}
                placeholder="Select Status..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Purchase Cost</label>
              <input
                type="number"
                value={formData.purchaseCost}
                onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Warranty End Date</label>
            <input
              type="date"
              value={formData.warrantyEnd}
              onChange={(e) => setFormData({ ...formData, warrantyEnd: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </form>
      )}
    </Modal>
  )
}
