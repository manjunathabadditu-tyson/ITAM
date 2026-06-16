'use client'

import { useRouter } from 'next/navigation'
import { AuthUser } from '@/types/auth'
import { useState } from 'react'

interface NavbarProps {
  user: AuthUser | null
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function Navbar({ user, isCollapsed, onToggleCollapse }: NavbarProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!user) return null

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '⚙️'
      case 'purchaser':
        return '💳'
      default:
        return '👤'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'var(--primary)'
      case 'purchaser':
        return 'var(--accent)'
      default:
        return 'var(--secondary)'
    }
  }

  return (
    <nav style={{ background: '#f5f1eb', borderBottom: '1px solid #e5dcd0' }} className="sticky top-0 z-40">
      <div className="max-w-full px-4 md:px-6 py-3 flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-600 shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" strokeWidth="2">
                <path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2H6a2 2 0 0 1 -2 -2z"></path>
                <path d="M15 4v16"></path>
                <path d="m9 10 2 2 -2 2"></path>
              </svg>
            ) : (
              <svg viewBox="-0.5 -0.5 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" strokeWidth="1">
                <path d="M12.7769375 14.284625H2.2230625c-0.8326875 0 -1.5076875 -0.675 -1.5076875 -1.5076875l0 -10.553875c0 -0.8326875 0.675 -1.5076875 1.5076875 -1.5076875h10.553875c0.8326875 0 1.5076875 0.675 1.5076875 1.5076875v10.553875c0 0.8326875 -0.675 1.5076875 -1.5076875 1.5076875Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M3.9192500000000003 5.9923125 2.6 7.5l1.3192499999999998 1.5076875" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M5.615375 14.284625V0.7153750000000001" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            )}
          </button>
          <div>
            <p className="text-lg font-semibold text-slate-900">ITAM</p>
            <p className="text-sm text-slate-500">Asset Management</p>
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition duration-200"
              title={`${user.name} (${user.role})`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ background: getRoleColor(user.role), color: 'white' }}>{getRoleIcon(user.role)}</div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* User Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white text-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden fade-in">
                <div className="p-4 border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-100">
                  <p className="font-bold text-gray-900 flex items-center gap-2">
                    <span>{getRoleIcon(user.role)}</span>
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                  <div className="mt-2 inline-block">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
                      style={{ background: getRoleColor(user.role), color: 'white' }}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-medium border-t border-gray-200 transition duration-200 flex items-center gap-2"
                >
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close menu when clicking outside */}
      {showMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowMenu(false)}
        />
      )}
    </nav>
  )
}
