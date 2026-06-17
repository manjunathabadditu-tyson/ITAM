import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { hasRole, ROLE_CODES } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasRole(user.role, ROLE_CODES.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: userId } = await params

    const assets = await prisma.asset.findMany({
      where: {
        currentHolder: userId,
        status: 'Assigned',
      },
      include: {
        type: true,
        assetName: true,
        location: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = assets.map((a: any) => ({
      id: a.id,
      assetTag: a.assetTag,
      type: a.type.name,
      model: a.assetName?.name || a.modelName,
      serialNum: a.serialNum,
      status: a.status,
      location: a.location?.name,
      purchaseCost: a.purchaseCost,
      warrantyEnd: a.warrantyEnd?.toISOString().split('T')[0],
      condition: a.condition,
    }))

    return NextResponse.json({ devices: formatted })
  } catch (error) {
    console.error('Failed to fetch user devices:', error)
    return NextResponse.json({ error: 'Failed to fetch user devices' }, { status: 500 })
  }
}
