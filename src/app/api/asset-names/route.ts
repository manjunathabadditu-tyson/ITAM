import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const typeId = request.nextUrl.searchParams.get('typeId')

    const assetNames = await prisma.assetName.findMany({
      where: typeId ? { assetTypeId: typeId } : {},
      include: { assetType: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ assetNames })
  } catch (error) {
    console.error('Failed to fetch asset names:', error)
    return NextResponse.json({ error: 'Failed to fetch asset names' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, manufacturer, assetTypeId, defaultSpecs, defaultWarrantyMonths } = await request.json()

    if (!name || !assetTypeId) {
      return NextResponse.json({ error: 'name and assetTypeId are required' }, { status: 400 })
    }

    const assetName = await prisma.assetName.create({
      data: {
        name,
        manufacturer,
        assetTypeId,
        defaultSpecs,
        defaultWarrantyMonths,
      },
      include: { assetType: true },
    })

    return NextResponse.json({ assetName }, { status: 201 })
  } catch (error) {
    console.error('Failed to create asset name:', error)
    const message = error instanceof Error ? error.message : 'Failed to create asset name'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
