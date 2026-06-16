import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const types = await prisma.assetType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      types: types.map((t: any) => ({
        id: t.id,
        name: t.name,
        code: t.code,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch asset types:', error)
    return NextResponse.json({ error: 'Failed to fetch asset types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, code } = await request.json()

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      )
    }

    const type = await prisma.assetType.create({
      data: {
        name,
        code,
        isActive: true,
      },
    })

    return NextResponse.json(
      {
        id: type.id,
        name: type.name,
        code: type.code,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create asset type:', error)
    return NextResponse.json({ error: 'Failed to create asset type' }, { status: 500 })
  }
}
