import 'dotenv/config'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const assets = await prisma.asset.findMany({
      where: { currentHolder: user.id },
      include: {
        type: { select: { name: true } },
        assetName: { select: { name: true, manufacturer: true } },
        location: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      assets: assets.map((asset) => ({
        id: asset.id,
        tag: asset.assetTag,
        type: asset.type.name,
        name: asset.assetName?.name,
        manufacturer: asset.assetName?.manufacturer,
        serialNum: asset.serialNum,
        status: asset.status,
        condition: asset.condition,
        location: asset.location?.name,
        purchaseCost: asset.purchaseCost,
        warrantyEnd: asset.warrantyEnd?.toISOString().split('T')[0],
      })),
    })
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}
