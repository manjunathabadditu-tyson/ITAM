import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { hasRole, ROLE_CODES } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const whereClause: any = {}

    if (status) {
      whereClause.status = status
    }

    if (type) {
      whereClause.type = { name: type }
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where: whereClause,
        include: {
          type: { select: { name: true } },
          assetName: { select: { name: true, manufacturer: true } },
          currentHolderUser: { select: { id: true, name: true, email: true } },
          location: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.asset.count({ where: whereClause }),
    ])

    return NextResponse.json({
      assets: assets.map((asset) => ({
        id: asset.id,
        tag: asset.assetTag,
        type: asset.type.name,
        name: asset.assetName?.name,
        manufacturer: asset.assetName?.manufacturer,
        serialNum: asset.serialNum,
        status: asset.status,
        condition: asset.condition,
        holder: asset.currentHolderUser
          ? { id: asset.currentHolderUser.id, name: asset.currentHolderUser.name, email: asset.currentHolderUser.email }
          : null,
        location: asset.location?.name,
        purchaseCost: asset.purchaseCost,
        warrantyStart: asset.warrantyStart?.toISOString().split('T')[0],
        warrantyEnd: asset.warrantyEnd?.toISOString().split('T')[0],
        createdAt: asset.createdAt.toISOString().split('T')[0],
      })),
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasRole(user.role, ROLE_CODES.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { assetTag, typeId, assetNameId, serialNum, status = 'Available', purchaseCost, warrantyEnd } = await request.json()

    if (!assetTag || !typeId || !serialNum) {
      return NextResponse.json(
        { error: 'assetTag, typeId, and serialNum are required' },
        { status: 400 }
      )
    }

    const newAsset = await prisma.asset.create({
      data: {
        assetTag,
        typeId,
        assetNameId: assetNameId || null,
        serialNum,
        status,
        purchaseCost: purchaseCost !== null && purchaseCost !== undefined ? purchaseCost : null,
        warrantyEnd: warrantyEnd ? new Date(warrantyEnd) : null,
      },
      include: {
        type: true,
        assetName: true,
      },
    })

    return NextResponse.json(
      {
        id: newAsset.id,
        tag: newAsset.assetTag,
        type: newAsset.type.name,
        typeId: newAsset.typeId,
        name: newAsset.assetName?.name,
        assetNameId: newAsset.assetNameId,
        serialNum: newAsset.serialNum,
        status: newAsset.status,
        purchaseCost: newAsset.purchaseCost,
        warrantyEnd: newAsset.warrantyEnd?.toISOString().split('T')[0] || null,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Failed to create asset:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Asset tag already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}
