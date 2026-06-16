import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const assets = await prisma.asset.findMany({
      where: {
        currentHolder: user.id,
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
      typeId: a.typeId,
      model: a.assetName?.name || a.modelName,
      serialNum: a.serialNum,
      status: a.status,
      location: a.location?.name,
      purchaseCost: a.purchaseCost,
      warrantyStart: a.warrantyStart?.toISOString().split('T')[0],
      warrantyEnd: a.warrantyEnd?.toISOString().split('T')[0],
      condition: a.condition,
      assignedDate: a.createdAt.toISOString().split('T')[0],
    }))

    return NextResponse.json({ devices: formatted })
  } catch (error) {
    console.error('Failed to fetch my devices:', error)
    return NextResponse.json({ error: 'Failed to fetch my devices' }, { status: 500 })
  }
}
