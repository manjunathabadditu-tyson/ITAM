'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TYSON_LOGO_URL = 'https://ok7static.oktacdn.com/fs/bco/1/fs0119p66hwJ94sr3358'

export default function LoginPage() {
  const router = useRouter()
  const [selectedEmail, setSelectedEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<any[]>([])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail }),
        credentials: 'include',
      })

      if (!res.ok) {
        setError('Login failed. Please try again.')
        setLoading(false)
        return
      }

      router.push('/dashboard-v2')
    } catch (err) {
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users')
        const { users: fetchedUsers } = await res.json()
        setUsers(fetchedUsers)
        if (fetchedUsers.length > 0) {
          setSelectedEmail(fetchedUsers[0].email)
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
      }
    }
    fetchUsers()
  }, [])

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Minimal Hero */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-16"
        style={{
          background: 'linear-gradient(135deg, #E51837 0%, #78082A 100%)',
        }}
      >
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-40 h-40 bg-transparent bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <img
                src={TYSON_LOGO_URL}
                alt="Tyson Foods"
                className="w-80 h-80 object-contain"
              />
            </div>
          </div>
          <h1
            className="text-5xl font-bold mb-2"
            style={{ color: '#FFFFFF' }}
          >
            ITAM
          </h1>
          <p
            className="text-lg font-light"
            style={{ color: '#FEE8EB' }}
          >
            IT Asset Management
          </p>
          <p
            className="text-sm mt-2"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Enterprise tracking made simple
          </p>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div
        className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-10 md:p-16"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: '#FEE8EB' }}>
              <img
                src={TYSON_LOGO_URL}
                alt="Tyson Foods"
                className="w-12 h-12 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">ITAM</h1>
            <p className="text-gray-600 text-sm">IT Asset Management</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-10">
            <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Account Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Account</label>
              <select
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none font-medium transition"
                style={{
                  borderColor: '#E5DCD0',
                  backgroundColor: '#F9F7F4',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#E51837')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5DCD0')}
              >
                <option value="">Select Account</option>
                {users.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-lg" style={{ background: '#FEE8EB', borderLeft: '4px solid #E51837' }}>
                <p className="text-sm font-medium" style={{ color: '#78082A' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={!selectedEmail || loading}
              className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105"
              style={{
                background: !selectedEmail || loading ? '#CCCCCC' : 'linear-gradient(135deg, #E51837 0%, #78082A 100%)',
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center" style={{ borderTopColor: '#E5DCD0', borderTopWidth: '1px', paddingTop: '2rem' }}>
            <p className="text-xs text-gray-500">
              Tyson Foods © 2026 • Confidential
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
