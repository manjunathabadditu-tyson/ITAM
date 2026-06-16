import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { hasRole, ROLE_CODES } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only ADMIN can view all requests
    if (!hasRole(user.role, ROLE_CODES.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const requestType = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (requestType && requestType !== 'all') {
      where.requestType = requestType
    }

    const [requests, total] = await Promise.all([
      prisma.assetRequest.findMany({
        where,
        include: {
          requestedByUser: { select: { id: true, name: true, email: true } },
          forUser: { select: { id: true, name: true, email: true } },
          approver: { select: { id: true, name: true } },
          rejector: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.assetRequest.count({ where }),
    ])

    return NextResponse.json({ requests, total, limit, offset })
  } catch (error) {
    console.error('Failed to fetch requests:', error)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}
