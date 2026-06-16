import 'server-only'
import { AuthUser } from '@/types/auth'
import prisma from './db'

export async function validateLogin(email: string): Promise<AuthUser | null> {
  const user = await prisma.appUser.findUnique({
    where: { email },
    include: { userRoles: { include: { role: true } } },
  })

  if (!user) return null

  const roles = user.userRoles.map((ur: any) => ur.role.code).join(',')

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: roles as any,
  }
}

export async function getAllUsers(): Promise<AuthUser[]> {
  const users = await prisma.appUser.findMany({
    where: { isActive: true },
    include: { userRoles: { include: { role: true } } },
  })

  return users.map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.userRoles.map((ur: any) => ur.role.code).join(',') as any,
  }))
}
