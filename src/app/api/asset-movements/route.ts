import 'dotenv/config'
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const movements = await prisma.assetMovement.findMany({
      include: {
        asset: true,
        performedByUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        fromUser: { select: { id: true, name: true } },
      },
      orderBy: {
        performedAt: 'desc',
      },
    })

    return NextResponse.json({
      movements: movements.map((m: any) => ({
        id: m.id,
        assetId: m.assetId,
        assetTag: m.asset.assetTag,
        action: m.action,
        fromStatus: m.fromStatus,
        toStatus: m.toStatus,
        fromUser: m.fromUser,
        toUser: m.toUser,
        performedBy: m.performedByUser,
        performedAt: m.performedAt.toISOString().split('T')[0],
        notes: m.notes,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch movements:', error)
    return NextResponse.json({ error: 'Failed to fetch movements' }, { status: 500 })
  }
}
