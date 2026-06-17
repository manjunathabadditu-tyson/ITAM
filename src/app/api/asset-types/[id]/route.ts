import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { hasRole, ROLE_CODES } from '@/lib/auth'
import prisma from '@/lib/db'

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
    const { name, code } = await request.json()

    if (!name || !code) {
      return NextResponse.json(
        { error: 'name and code are required' },
        { status: 400 }
      )
    }

    const updated = await prisma.assetType.update({
      where: { id },
      data: {
        name,
        code: code.toUpperCase(),
      },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      code: updated.code,
    })
  } catch (error: any) {
    console.error('Failed to update asset type:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Asset type code already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update asset type' }, { status: 500 })
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

    const assetType = await prisma.assetType.findUnique({ where: { id } })

    if (!assetType) {
      return NextResponse.json({ error: 'Asset type not found' }, { status: 404 })
    }

    await prisma.assetType.delete({
      where: { id },
    })

    return NextResponse.json({
      id,
      message: 'Asset type deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete asset type:', error)
    return NextResponse.json({ error: 'Failed to delete asset type' }, { status: 500 })
  }
}
