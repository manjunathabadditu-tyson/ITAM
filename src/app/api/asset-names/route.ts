import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { hasRole, ROLE_CODES } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assetTypeId = searchParams.get('assetTypeId')

    const whereClause: any = assetTypeId ? { assetTypeId } : {}

    const names = await prisma.assetName.findMany({
      where: whereClause as any,
      include: {
        assetType: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })

    const formatted = names.map((n: any) => ({
      id: n.id,
      name: n.name,
      manufacturer: n.manufacturer,
      assetTypeId: n.assetTypeId,
      type: n.assetType?.name,
    }))

    return NextResponse.json({ names: formatted })
  } catch (error) {
    console.error('Failed to fetch asset names:', error)
    return NextResponse.json({ error: 'Failed to fetch asset names' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasRole(user.role, ROLE_CODES.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, assetTypeId, manufacturer } = await request.json()

    if (!name || !assetTypeId) {
      return NextResponse.json(
        { error: 'name and assetTypeId are required' },
        { status: 400 }
      )
    }

    const newName = await prisma.assetName.create({
      data: {
        name,
        assetTypeId,
        manufacturer: manufacturer || null,
      },
      include: {
        assetType: { select: { name: true } },
      },
    })

    return NextResponse.json(
      {
        id: newName.id,
        name: newName.name,
        assetTypeId: newName.assetTypeId,
        manufacturer: newName.manufacturer,
        type: newName.assetType?.name,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Failed to create asset name:', error)
    return NextResponse.json({ error: 'Failed to create asset name' }, { status: 500 })
  }
}
