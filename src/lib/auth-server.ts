import 'server-only'
import { cookies } from 'next/headers'
import { AuthUser } from '@/types/auth'

export async function setAuthCookie(user: AuthUser) {
  const cookieStore = await cookies()
  cookieStore.set('itam_user', JSON.stringify(user), {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
  })
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('itam_user')
  if (!userCookie) return null
  try {
    return JSON.parse(userCookie.value)
  } catch {
    return null
  }
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('itam_user')
}
