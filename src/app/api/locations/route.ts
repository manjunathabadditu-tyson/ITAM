import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Failed to fetch locations:', error)
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, code, site, address } = await request.json()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const location = await prisma.location.create({
      data: { name, code, site, address },
    })

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error('Failed to create location:', error)
    const message = error instanceof Error ? error.message : 'Failed to create location'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
