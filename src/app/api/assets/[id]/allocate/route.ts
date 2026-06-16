import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { performAssetMovement } from '@/lib/asset-movements'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { toUserId, locationId, notes } = await request.json()

    if (!toUserId) {
      return NextResponse.json({ error: 'toUserId is required' }, { status: 400 })
    }

    const { id: assetId } = await params
    const asset = await performAssetMovement(assetId, 'Allocate', {
      toUserId,
      locationId,
      notes,
      performedBy: user.id,
    })

    return NextResponse.json({
      id: asset.id,
      assetTag: asset.assetTag,
      status: asset.status,
      currentHolder: asset.currentHolder,
      message: 'Asset allocated successfully',
    })
  } catch (error) {
    console.error('Failed to allocate asset:', error)
    const message = error instanceof Error ? error.message : 'Failed to allocate asset'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
