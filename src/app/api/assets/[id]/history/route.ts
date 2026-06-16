import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const movements = await prisma.assetMovement.findMany({
      where: { assetId: id },
      include: {
        performedByUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
        fromUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { performedAt: 'desc' },
    })

    const formatted = movements.map((m: any) => ({
      id: m.id,
      action: m.action,
      fromStatus: m.fromStatus,
      toStatus: m.toStatus,
      fromUser: m.fromUser,
      toUser: m.toUser,
      performedBy: m.performedByUser,
      performedAt: m.performedAt,
      reason: m.reason,
      notes: m.notes,
      refTicket: m.refTicket,
    }))

    return NextResponse.json({ movements: formatted })
  } catch (error) {
    console.error('Failed to fetch asset history:', error)
    return NextResponse.json({ error: 'Failed to fetch asset history' }, { status: 500 })
  }
}
