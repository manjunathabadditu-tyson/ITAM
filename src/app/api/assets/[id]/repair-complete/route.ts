import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { performAssetMovement } from '@/lib/asset-movements'
import { getAuthUser } from '@/lib/auth-server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { notes } = await request.json()

    const { id } = await params
    const asset = await performAssetMovement(id, 'RepairComplete', {
      notes,
      performedBy: user.id,
    })

    return NextResponse.json({
      id: asset.id,
      assetTag: asset.assetTag,
      status: asset.status,
      message: 'Asset repair completed and returned to available',
    })
  } catch (error) {
    console.error('Failed to mark repair complete:', error)
    const message = error instanceof Error ? error.message : 'Failed to mark repair complete'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
