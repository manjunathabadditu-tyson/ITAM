import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { setAuthCookie } from '@/lib/auth-server'
import { validateLogin } from '@/lib/auth.server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    const user = await validateLogin(email)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    await setAuthCookie(user)
    return NextResponse.json({ success: true, user })
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
