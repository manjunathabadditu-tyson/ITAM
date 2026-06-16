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

    // Only ADMIN can approve
    if (!hasRole(user.role, ROLE_CODES.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { notes } = await request.json()
    const { id } = await params

    // Get the request
    const assetRequest = await prisma.assetRequest.findUnique({
      where: { id },
    })

    if (!assetRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (assetRequest.status !== 'Open') {
      return NextResponse.json(
        { error: `Cannot approve request with status: ${assetRequest.status}` },
        { status: 400 }
      )
    }

    // Update request status
    const updated = await prisma.assetRequest.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedBy: user.id,
        approvalDate: new Date(),
        approvalNotes: notes || null,
      },
      include: {
        requestedByUser: { select: { id: true, name: true, email: true } },
        forUser: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true } },
      },
    })

    // Auto-allocate asset when request is approved
    // For "Allocate" requests: allocate to the requesting user
    // For "New" requests: allocate to the requesting user
    const userToAllocate = assetRequest.forUserId || assetRequest.requestedBy

    if (userToAllocate) {
      const availableAsset = await prisma.asset.findFirst({
        where: { status: 'Available' },
        orderBy: { createdAt: 'desc' }, // Get the most recent available asset
      })

      if (availableAsset) {
        // Update asset status and assign to user
        await prisma.asset.update({
          where: { id: availableAsset.id },
          data: {
            status: 'Assigned',
            currentHolder: userToAllocate,
          },
        })

        // Create asset movement record
        await prisma.assetMovement.create({
          data: {
            assetId: availableAsset.id,
            action: 'Allocate',
            fromStatus: 'Available',
            toStatus: 'Assigned',
            toUserId: userToAllocate,
            performedBy: user.id,
            notes: `Auto-allocated on request approval: ${assetRequest.id}`,
          },
        })
      }
    }

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('Failed to approve request:', error)
    return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 })
  }
}
