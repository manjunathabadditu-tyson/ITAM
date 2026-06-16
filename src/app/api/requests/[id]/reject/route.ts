import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { hasRole, ROLE_CODES } from '@/lib/auth'
import prisma from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only ADMIN can reject
    if (!hasRole(user.role, ROLE_CODES.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { reason } = await request.json()
    const { id } = await params

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Get the request
    const assetRequest = await prisma.assetRequest.findUnique({
      where: { id },
    })

    if (!assetRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (assetRequest.status !== 'Open') {
      return NextResponse.json(
        { error: `Cannot reject request with status: ${assetRequest.status}` },
        { status: 400 }
      )
    }

    // Update request status
    const updated = await prisma.assetRequest.update({
      where: { id },
      data: {
        status: 'Rejected',
        rejectedBy: user.id,
        rejectionDate: new Date(),
        rejectionReason: reason,
      },
      include: {
        requestedByUser: { select: { id: true, name: true, email: true } },
        forUser: { select: { id: true, name: true, email: true } },
        rejector: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Failed to reject request:', error)
    return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 })
  }
}
