import 'dotenv/config'
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // Get asset counts by status
    const [total, available, assigned, repair, retired, disposed] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'Available' } }),
      prisma.asset.count({ where: { status: 'Assigned' } }),
      prisma.asset.count({ where: { status: 'Repair' } }),
      prisma.asset.count({ where: { status: 'Retired' } }),
      prisma.asset.count({ where: { status: 'Disposed' } }),
    ])

    // Get warranty alerts (assets expiring within 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const warrantyAlerts = await prisma.asset.count({
      where: {
        warrantyEnd: {
          lte: thirtyDaysFromNow,
          gt: new Date(),
        },
      },
    })

    // Get recent movements with assignee info
    const recentMovements = await prisma.assetMovement.findMany({
      take: 15,
      orderBy: { performedAt: 'desc' },
      include: {
        asset: { select: { assetTag: true, type: { select: { name: true } } } },
        toUser: { select: { name: true, email: true } },
        fromUser: { select: { name: true } },
      },
    })

    return NextResponse.json({
      counts: {
        total,
        Available: available,
        Assigned: assigned,
        Repair: repair,
        Retired: retired,
        Disposed: disposed,
      },
      warrantyAlerts,
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        asset: { tag: m.asset.assetTag, type: m.asset.type.name },
        action: m.action,
        assignedTo: m.toUser ? { name: m.toUser.name, email: m.toUser.email } : null,
        fromUser: m.fromUser ? { name: m.fromUser.name } : null,
        performedAt: m.performedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    )
  }
}
