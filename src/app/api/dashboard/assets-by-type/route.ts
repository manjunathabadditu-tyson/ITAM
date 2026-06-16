import 'dotenv/config'
import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status')

    // Get asset types with counts
    const assetTypes = await prisma.assetType.findMany({
      where: { isActive: true },
      select: { name: true },
    })

    // For each type, count total, available, and assigned assets
    const result = await Promise.all(
      assetTypes.map(async (type) => {
        const baseWhere = { type: { name: type.name } }
        const whereClause = statusFilter
          ? { ...baseWhere, status: statusFilter }
          : baseWhere

        const [total, available, assigned] = await Promise.all([
          prisma.asset.count({ where: statusFilter ? whereClause : baseWhere }),
          prisma.asset.count({ where: { type: { name: type.name }, status: 'Available' } }),
          prisma.asset.count({ where: { type: { name: type.name }, status: 'Assigned' } }),
        ])

        return {
          type: type.name,
          total,
          available,
          assigned,
        }
      })
    )

    // Filter out types with 0 assets and sort by total count descending
    return NextResponse.json(
      result.filter((r) => r.total > 0).sort((a, b) => b.total - a.total)
    )
  } catch (error) {
    console.error('Assets by type error:', error)
    return NextResponse.json(
      { error: 'Failed to load asset types' },
      { status: 500 }
    )
  }
}
