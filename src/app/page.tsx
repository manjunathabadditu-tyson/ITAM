'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      const { user } = await res.json()
      if (user) {
        router.push('/dashboard-v2')
      } else {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--light)' }}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 mb-6" style={{ borderColor: 'var(--light)', borderTopColor: 'var(--primary)' }}></div>
        <p className="text-gray-600 font-medium text-lg">Loading ITAM Dashboard...</p>
      </div>
    </div>
  )
}