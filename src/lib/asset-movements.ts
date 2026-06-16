import prisma from '@/lib/db'

export type AssetAction = 'Allocate' | 'Deallocate' | 'Transfer' | 'Repair' | 'RepairComplete' | 'Retire' | 'Dispose'

export const VALID_TRANSITIONS: Record<string, AssetAction[]> = {
  Available: ['Allocate', 'Repair', 'Retire'],
  Assigned: ['Deallocate', 'Transfer', 'Repair', 'Retire'],
  Repair: ['RepairComplete', 'Retire'],
  Retired: ['Dispose'],
  Disposed: [],
}

export const ACTION_STATUS_MAP: Record<AssetAction, { fromStatus?: string; toStatus: string }> = {
  Allocate: { fromStatus: 'Available', toStatus: 'Assigned' },
  Deallocate: { fromStatus: 'Assigned', toStatus: 'Available' },
  Transfer: { fromStatus: 'Assigned', toStatus: 'Assigned' },
  Repair: { toStatus: 'Repair' },
  RepairComplete: { fromStatus: 'Repair', toStatus: 'Available' },
  Retire: { toStatus: 'Retired' },
  Dispose: { fromStatus: 'Retired', toStatus: 'Disposed' },
}

export async function performAssetMovement(
  assetId: string,
  action: AssetAction,
  {
    toUserId,
    locationId,
    reason,
    notes,
    refTicket,
    performedBy,
  }: {
    toUserId?: string
    locationId?: string
    reason?: string
    notes?: string
    refTicket?: string
    performedBy: string
  }
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error('Asset not found')

  const mapping = ACTION_STATUS_MAP[action]
  const validTransitions = VALID_TRANSITIONS[asset.status] || []

  if (!validTransitions.includes(action)) {
    throw new Error(
      `Cannot perform "${action}" on asset in "${asset.status}" status. Valid actions: ${validTransitions.join(', ')}`
    )
  }

  // Update asset
  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: {
      status: mapping.toStatus,
      ...(toUserId && { currentHolder: toUserId }),
      ...(locationId && { locationId }),
      updatedAt: new Date(),
    },
    include: { type: true },
  })

  // Record movement
  await prisma.assetMovement.create({
    data: {
      assetId,
      action,
      fromStatus: asset.status,
      toStatus: mapping.toStatus,
      fromUserId: asset.currentHolder,
      toUserId: toUserId || null,
      performedBy,
      reason,
      notes,
      refTicket,
    },
  })

  return updatedAsset
}
