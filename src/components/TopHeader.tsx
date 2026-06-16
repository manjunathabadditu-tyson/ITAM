'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AuthUser } from '@/types/auth'

interface TopHeaderProps {
  user: AuthUser | null
  isCollapsed: boolean
  onToggleCollapse: () => void
  pageTitle?: string
}

export default function TopHeader({ user, isCollapsed, onToggleCollapse, pageTitle }: TopHeaderProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#E51837'
      case 'purchaser':
        return '#FEBF58'
      default:
        return '#002554'
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 lg:px-10 py-4 flex justify-between items-center flex-shrink-0">
      {/* Left: Collapse Button & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 flex-shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
        {pageTitle && (
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">{pageTitle}</h1>
        )}
      </div>

      {/* Right: User Profile */}
      <div className="flex items-center gap-3">
        {/* User Profile Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ background: getRoleColor(user.role) }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                <div className="mt-2 inline-block">
                  <span
                    className="px-2 py-1 rounded-full text-xs font-semibold text-white capitalize"
                    style={{ background: getRoleColor(user.role) }}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMenu(false)
                  handleLogout()
                }}
                className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-medium transition flex items-center gap-2"
              >
                <span>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Close menu backdrop */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}
