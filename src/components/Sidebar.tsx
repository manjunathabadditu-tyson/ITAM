'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthUser } from '@/types/auth'
import { useState, useEffect } from 'react'
import tysonLogo from '../svg/tysonlogo.png'
import collapseSvg from '../svg/Sidebar-Collapse--Streamline-Iconoir.svg'
import collapseRightSvg from '../svg/Layout-Sidebar-Right-Collapse--Streamline-Tabler.svg'
import { useRouter } from 'next/navigation'
import { ROLE_CODES, hasAnyRole } from '@/lib/auth'

interface NavSection {
  title: string
  items: NavItem[]
}

interface NavItem {
  href: string
  label: string
  icon: string
  roles: string[]
}

interface SidebarProps {
  user: AuthUser | null
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const SELECTED_HIGHLIGHT_COLOR = '#ece3d0'

export default function Sidebar({ user, isCollapsed, onToggleCollapse }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const navSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { href: '/dashboard-v2', label: 'Dashboard', icon: '📊', roles: [ROLE_CODES.ADMIN] },
        { href: '/devices', label: 'My Devices', icon: '💻', roles: [ROLE_CODES.USER] },
        { href: '/my-requests', label: 'My Requests', icon: '📋', roles: [ROLE_CODES.USER] },
        { href: '/request-asset', label: 'Request Asset', icon: '➕', roles: [ROLE_CODES.USER] },
      ],
    },
    {
      title: 'Admin',
      items: [
        { href: '/inventory', label: 'All Assets', icon: '📦', roles: [ROLE_CODES.ADMIN] },
        { href: '/admin/users', label: 'Users', icon: '👥', roles: [ROLE_CODES.ADMIN] },
        { href: '/admin/requests', label: 'Requests', icon: '✅', roles: [ROLE_CODES.ADMIN] },
        { href: '/purchase', label: 'Invoices', icon: '🧾', roles: [ROLE_CODES.ADMIN] },
        { href: '/purchase/add', label: 'Add Invoice', icon: '➕', roles: [ROLE_CODES.ADMIN] },
        { href: '/admin/asset-types', label: 'Asset Types', icon: '🏷️', roles: [ROLE_CODES.ADMIN] },
        { href: '/admin/models', label: 'Models', icon: '📱', roles: [ROLE_CODES.ADMIN] },
        { href: '/admin/locations', label: 'Locations', icon: '📍', roles: [ROLE_CODES.ADMIN] },
        { href: '/admin/vendors', label: 'Vendors', icon: '🏢', roles: [ROLE_CODES.ADMIN] },
      ],
    },
  ]

  // Auto-expand section when a link in it becomes active
  useEffect(() => {
    const activeSection = navSections.find((section) =>
      section.items.some((item) => isActive(item.href))
    )
    if (activeSection && !isCollapsed) {
      setExpandedSections((prev) => new Set(prev).add(activeSection.title))
    }
  }, [pathname, isCollapsed])

  if (!user) return null

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const toggleSection = (title: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(title)) {
      newExpanded.delete(title)
    } else {
      newExpanded.add(title)
    }
    setExpandedSections(newExpanded)
  }

  const visibleSections = navSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      // Check if user has any of the required roles
      return hasAnyRole(user.role, item.roles)
    }),
  })).filter(section => section.items.length > 0)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const getRoleColor = (role: string) => {
    if (role.includes('ADMIN')) return '#E51837'
    if (role.includes('PURCHASE')) return '#FEBF58'
    return '#002554'
  }

  const getRoleIcon = (role: string) => {
    if (role.includes('ADMIN')) return '⚙️'
    if (role.includes('PURCHASE')) return '💳'
    return '👤'
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 transition-all duration-300 z-40 flex flex-col overflow-hidden"
      style={{
        width: isCollapsed ? '60px' : '240px',
        backgroundColor: '#f5f1eb',
        borderRight: '1px solid #e5dcd0',
      }}
    >
      {/* Sidebar Brand / Toggle */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'py-3' : 'pb-4'}`}>
        {isCollapsed ? (
          <div className="flex items-center justify-center px-2">
            <button
              onClick={onToggleCollapse}
              className="w-14 h-14 rounded-2xl bg-white border border-[#e5dcd0] shadow-sm flex items-center justify-center transition hover:bg-gray-100"
              title="Expand sidebar"
            >
              <Image src={collapseSvg} alt="Open" width={26} height={26} className="object-contain" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#e5dcd0]">
            <div className="flex items-center gap-3">
                <Image
                  src={tysonLogo}
                  alt="Tyson Foods"
                  width={90}
                  height={40}
                  className="object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                />
              <div>
                <p className="text-sm font-semibold text-slate-900">ITAM</p>
                <p className="text-xs text-slate-500">Asset Management</p>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg text-[#5A5A5A] hover:bg-gray-100 transition"
              title="Collapse sidebar"
            >
              <Image src={collapseRightSvg} alt="Collapse" width={18} height={18} className="object-contain" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto">
        {isCollapsed ? (
          // Collapsed: Icons only
          <div className="space-y-3 p-3 pt-4">
            {visibleSections.map((section) =>
              section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-center w-12 h-12 rounded-lg transition text-lg shrink-0"
                  style={{
                    backgroundColor: isActive(item.href) ? SELECTED_HIGHLIGHT_COLOR : 'transparent',
                    color: isActive(item.href) ? '#78082A' : '#5A5A5A',
                  }}
                  title={item.label}
                >
                  {item.icon}
                </Link>
              ))
            )}
          </div>
        ) : (
          // Expanded: Show sections and items
          <div className="pt-6 pb-4">
            {visibleSections.map((section, index) => (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold uppercase transition"
                  style={{
                    color: '#5A5A5A',
                  }}
                >
                  {section.title}
                  <span
                    className={`transition-transform ${
                      expandedSections.has(section.title) ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {expandedSections.has(section.title) && (
                  <div className="mt-2 space-y-1 px-2">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium"
                        style={{
                          backgroundColor: isActive(item.href) ? SELECTED_HIGHLIGHT_COLOR : 'transparent',
                          color: isActive(item.href) ? '#78082A' : '#5A5A5A',
                        }}
                      >
                        <span className="shrink-0 text-base">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Gap between sections */}
                {index < visibleSections.length - 1 && (
                  <div className="h-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Profile at bottom */}
      <div className="px-3 py-4 border-t border-[#e5dcd0]">
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ background: getRoleColor(user.role) }}
            >
              {getRoleIcon(user.role)}
            </div>
            {!isCollapsed && (
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute left-3 bottom-14 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false)
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

    </aside>
  )
}
