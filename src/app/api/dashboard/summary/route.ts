import 'dotenv/config'
import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filterType = searchParams.get('filterType') // 'status' or 'type'
    const filterValue = searchParams.get('filterValue') // e.g., 'Available' or 'Laptop'

    // Build filter condition
    let assetFilter: any = {}
    if (filterType === 'status' && filterValue) {
      assetFilter.status = filterValue
    } else if (filterType === 'type' && filterValue) {
      assetFilter.type = { name: filterValue }
    }

    // Get asset counts by status
    const [total, available, assigned, repair, retired, disposed] = await Promise.all([
      prisma.asset.count({ where: assetFilter }),
      prisma.asset.count({ where: { ...assetFilter, status: 'Available' } }),
      prisma.asset.count({ where: { ...assetFilter, status: 'Assigned' } }),
      prisma.asset.count({ where: { ...assetFilter, status: 'Repair' } }),
      prisma.asset.count({ where: { ...assetFilter, status: 'Retired' } }),
      prisma.asset.count({ where: { ...assetFilter, status: 'Disposed' } }),
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

    // Get recent movements with assignee info (filtered if applicable)
    let movementFilter: any = {}
    if (filterType === 'status' && filterValue) {
      movementFilter.asset = { status: filterValue }
    } else if (filterType === 'type' && filterValue) {
      movementFilter.asset = { type: { name: filterValue } }
    }

    const recentMovements = await prisma.assetMovement.findMany({
      take: 15,
      orderBy: { performedAt: 'desc' },
      where: movementFilter,
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
