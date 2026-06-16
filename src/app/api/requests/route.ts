import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const requests = await prisma.assetRequest.findMany({
      where: { requestedBy: user.id },
      include: {
        requestedByUser: { select: { id: true, name: true, email: true } },
        forUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Failed to fetch requests:', error)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { requestType, forUserId, assetId, notes } = await request.json()

    if (!requestType || !['Allocate', 'Return', 'Issue', 'New'].includes(requestType)) {
      return NextResponse.json({ error: 'Invalid requestType' }, { status: 400 })
    }

    const newRequest = await prisma.assetRequest.create({
      data: {
        requestType,
        requestedBy: user.id,
        forUserId: forUserId || null,
        assetId: assetId || null,
        notes,
      },
      include: {
        requestedByUser: { select: { id: true, name: true, email: true } },
        forUser: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error('Failed to create request:', error)
    const message = error instanceof Error ? error.message : 'Failed to create request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
