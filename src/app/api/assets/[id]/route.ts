import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        type: true,
      },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: asset.id,
      assetTag: asset.assetTag,
      type: asset.type.name,
      typeId: asset.typeId,
      modelName: asset.modelName,
      serialNum: asset.serialNum,
      status: asset.status,
      currentHolderId: asset.currentHolder,
      purchaseCost: asset.purchaseCost,
      warrantyEnd: asset.warrantyEnd?.toISOString().split('T')[0] || null,
      createdAt: asset.createdAt.toISOString().split('T')[0],
      updatedAt: asset.updatedAt.toISOString().split('T')[0],
    })
  } catch (error) {
    console.error('Failed to fetch asset:', error)
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status, currentHolder } = await request.json()

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        status,
        currentHolder,
      },
      include: {
        type: true,
      },
    })

    // Create movement record
    if (currentHolder !== undefined) {
      await prisma.assetMovement.create({
        data: {
          assetId: asset.id,
          action: status === 'Assigned' ? 'Allocate' : 'Deallocate',
          fromStatus: status === 'Assigned' ? 'Available' : 'Assigned',
          toStatus: status,
          toUser: status === 'Assigned' ? currentHolder : null,
          performedBy: '1', // TODO: Get from auth context
          notes: `Asset ${status === 'Assigned' ? 'allocated to' : 'deallocated from'} user`,
        },
      })
    }

    return NextResponse.json({
      id: asset.id,
      assetTag: asset.assetTag,
      type: asset.type.name,
      status: asset.status,
      currentHolderId: asset.currentHolder,
    })
  } catch (error) {
    console.error('Failed to update asset:', error)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}
