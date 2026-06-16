import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ vendors })
  } catch (error) {
    console.error('Failed to fetch vendors:', error)
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, code, contactInfo } = await request.json()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const vendor = await prisma.vendor.create({
      data: { name, code, contactInfo },
    })

    return NextResponse.json({ vendor }, { status: 201 })
  } catch (error) {
    console.error('Failed to create vendor:', error)
    const message = error instanceof Error ? error.message : 'Failed to create vendor'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
