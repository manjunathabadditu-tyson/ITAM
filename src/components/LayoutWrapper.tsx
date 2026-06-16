'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { AuthUser } from '@/types/auth'

interface LayoutWrapperProps {
  user: AuthUser | null
  children: React.ReactNode
  pageTitle?: string
}

export default function LayoutWrapper({ user, children, pageTitle }: LayoutWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) setIsCollapsed(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  if (!user) return <>{children}</>
  if (!mounted) return null

  const sidebarWidth = isCollapsed ? 60 : 240

  return (
    <div className="h-screen bg-gray-50">
      <Sidebar
        user={user}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div className="flex flex-col h-full transition-all duration-300" style={{ marginLeft: `${sidebarWidth}px` }}>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
