import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get all direct reports
    const directReports = await prisma.appUser.findMany({
      where: { managerId: user.id },
      select: { id: true },
    })

    const reportIds = directReports.map((r: any) => r.id)
    if (reportIds.length === 0) {
      return NextResponse.json({ teamDevices: [] })
    }

    const assets = await prisma.asset.findMany({
      where: {
        currentHolder: { in: reportIds },
        status: 'Assigned',
      },
      include: {
        type: true,
        assetName: true,
        location: true,
        currentHolderUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = assets.map((a: any) => ({
      id: a.id,
      assetTag: a.assetTag,
      assignee: a.currentHolderUser,
      type: a.type.name,
      model: a.assetName?.name || a.modelName,
      serialNum: a.serialNum,
      status: a.status,
      location: a.location?.name,
      warrantyEnd: a.warrantyEnd?.toISOString().split('T')[0],
      condition: a.condition,
      assignedDate: a.createdAt.toISOString().split('T')[0],
    }))

    return NextResponse.json({ teamDevices: formatted })
  } catch (error) {
    console.error('Failed to fetch team devices:', error)
    return NextResponse.json({ error: 'Failed to fetch team devices' }, { status: 500 })
  }
}
