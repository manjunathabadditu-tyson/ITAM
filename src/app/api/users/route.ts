import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { hasRole, ROLE_CODES } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const users = await prisma.appUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        department: { select: { name: true } },
        userRoles: {
          select: {
            role: {
              select: { code: true },
            },
          },
        },
        _count: {
          select: { currentAssets: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      department: u.department?.name,
      role: u.userRoles[0]?.role.code || 'USER',
      isActive: u.isActive,
      _count: { devices: u._count.currentAssets },
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasRole(user.role, ROLE_CODES.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email, name, roleCode } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'email and name are required' },
        { status: 400 }
      )
    }

    const finalRoleCode = roleCode || ROLE_CODES.USER

    const role = await prisma.role.findUnique({
      where: { code: finalRoleCode },
    })

    if (!role) {
      return NextResponse.json({ error: 'Invalid role code' }, { status: 400 })
    }

    const newUser = await prisma.appUser.create({
      data: {
        email,
        name,
        authType: 'Local',
        isActive: true,
        userRoles: {
          create: { roleId: role.id },
        },
      },
      include: {
        userRoles: {
          select: {
            role: { select: { code: true } },
          },
        },
        department: { select: { name: true } },
      },
    })

    return NextResponse.json(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        department: newUser.department?.name,
        role: newUser.userRoles[0]?.role.code,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Failed to create user:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!hasRole(user.role, ROLE_CODES.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, isActive } = await request.json()

    if (!userId || isActive === undefined) {
      return NextResponse.json(
        { error: 'userId and isActive are required' },
        { status: 400 }
      )
    }

    const updated = await prisma.appUser.update({
      where: { id: userId },
      data: { isActive },
      include: {
        userRoles: {
          select: {
            role: { select: { code: true } },
          },
        },
        department: { select: { name: true } },
      },
    })

    return NextResponse.json(
      {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        department: updated.department?.name,
        role: updated.userRoles[0]?.role.code,
        isActive: updated.isActive,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
