import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ departments })
  } catch (error) {
    console.error('Failed to fetch departments:', error)
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, code } = await request.json()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const department = await prisma.department.create({
      data: { name, code },
    })

    return NextResponse.json({ department }, { status: 201 })
  } catch (error) {
    console.error('Failed to create department:', error)
    const message = error instanceof Error ? error.message : 'Failed to create department'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
