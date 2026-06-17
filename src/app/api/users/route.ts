import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-server'
import { hasRole, ROLE_CODES } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const [users, total] = await Promise.all([
      prisma.appUser.findMany({
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
        take: limit,
        skip: offset,
      }),
      prisma.appUser.count(),
    ])

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      department: u.department?.name,
      role: u.userRoles[0]?.role.code || 'USER',
      isActive: u.isActive,
      _count: { devices: u._count.currentAssets },
    }))

    return NextResponse.json({ users: formattedUsers, total, limit, offset })
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

    const { userId, isActive, name, email, roleCode } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    if (name !== undefined) {
      updateData.name = name
    }

    if (email !== undefined) {
      updateData.email = email
    }

    const updated = await prisma.appUser.update({
      where: { id: userId },
      data: updateData,
      include: {
        userRoles: {
          select: {
            role: { select: { code: true, id: true } },
          },
        },
        department: { select: { name: true } },
      },
    })

    // Handle role update if provided
    if (roleCode) {
      const role = await prisma.role.findUnique({
        where: { code: roleCode },
      })

      if (!role) {
        return NextResponse.json({ error: 'Invalid role code' }, { status: 400 })
      }

      await prisma.userRole.deleteMany({
        where: { userId: userId },
      })

      await prisma.userRole.create({
        data: {
          userId: userId,
          roleId: role.id,
        },
      })
    }

    // Fetch updated user with new role
    const finalUser = await prisma.appUser.findUnique({
      where: { id: userId },
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
        id: finalUser!.id,
        email: finalUser!.email,
        name: finalUser!.name,
        department: finalUser!.department?.name,
        role: finalUser!.userRoles[0]?.role.code,
        isActive: finalUser!.isActive,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Failed to update user:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
