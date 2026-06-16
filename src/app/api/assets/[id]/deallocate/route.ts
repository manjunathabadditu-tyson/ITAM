import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { hasRole, ROLE_CODES } from '@/lib/auth'
import { performAssetMovement } from '@/lib/asset-movements'
import prisma from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { condition, notes } = await request.json()
    const { id: assetId } = await params

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Non-admins can only deallocate their own assets
    if (!hasRole(user.role, ROLE_CODES.ADMIN) && asset.currentHolder !== user.id) {
      return NextResponse.json({ error: 'You can only return your own assets' }, { status: 403 })
    }

    const updatedAsset = await performAssetMovement(assetId, 'Deallocate', {
      reason: 'Return by user',
      notes: notes || '',
      performedBy: user.id,
    })

    return NextResponse.json({
      id: updatedAsset.id,
      assetTag: updatedAsset.assetTag,
      status: updatedAsset.status,
      message: 'Asset returned successfully',
    })
  } catch (error) {
    console.error('Failed to deallocate asset:', error)
    const message = error instanceof Error ? error.message : 'Failed to deallocate asset'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
