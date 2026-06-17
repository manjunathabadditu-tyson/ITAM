import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { hasRole, ROLE_CODES } from '@/lib/auth'
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
        assetName: true,
      },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: asset.id,
      tag: asset.assetTag,
      type: asset.type.name,
      typeId: asset.typeId,
      name: asset.assetName?.name,
      assetNameId: asset.assetNameId,
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
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasRole(user.role, ROLE_CODES.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { assetTag, typeId, assetNameId, serialNum, status, purchaseCost, warrantyEnd } = await request.json()

    if (!assetTag || !typeId || !serialNum) {
      return NextResponse.json(
        { error: 'assetTag, typeId, and serialNum are required' },
        { status: 400 }
      )
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        assetTag,
        typeId,
        assetNameId: assetNameId || null,
        serialNum,
        status,
        purchaseCost: purchaseCost !== null ? purchaseCost : undefined,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
      },
      include: {
        type: true,
        assetName: true,
      },
    })

    return NextResponse.json({
      id: asset.id,
      tag: asset.assetTag,
      type: asset.type.name,
      typeId: asset.typeId,
      name: asset.assetName?.name,
      assetNameId: asset.assetNameId,
      serialNum: asset.serialNum,
      status: asset.status,
      purchaseCost: asset.purchaseCost,
      warrantyEnd: asset.warrantyEnd?.toISOString().split('T')[0] || null,
    })
  } catch (error) {
    console.error('Failed to update asset:', error)
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasRole(user.role, ROLE_CODES.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const asset = await prisma.asset.findUnique({ where: { id } })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Delete related movement records first
    await prisma.assetMovement.deleteMany({
      where: { assetId: id },
    })

    // Delete the asset
    await prisma.asset.delete({
      where: { id },
    })

    return NextResponse.json({
      id,
      message: 'Asset deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete asset:', error)
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
