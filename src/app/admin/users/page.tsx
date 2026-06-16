'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import Modal from '@/components/Modal'
import { AuthUser } from '@/types/auth'

interface User {
  id: string
  name: string
  email: string
  role: string
  department?: string
  isActive: boolean
  createdAt: string
  _count?: { devices: number }
}

const ROLES = ['ADMIN', 'USER']

export default function UsersPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleCode: 'USER',
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const authRes = await fetch('/api/auth/me', { credentials: 'include' })
        const { user: authUser } = await authRes.json()
        console.log('Auth user:', authUser)
        if (!authUser) {
          console.log('No auth user, redirecting to login')
          router.push('/login')
          return
        }
        if (!authUser.role.includes('ADMIN')) {
          console.log('User role does not include ADMIN:', authUser.role)
          router.push('/dashboard')
          return
        }
        setUser(authUser)

        const usersRes = await fetch('/api/users')
        const { users: fetchedUsers } = await usersRes.json()
        setUsers(fetchedUsers)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load users:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (!user || loading) return null

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.roleCode) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to create user')
      }

      const newUser = await res.json()
      setUsers([...users, newUser])
      setMessage({ type: 'success', text: 'User created successfully' })
      setFormData({ name: '', email: '', roleCode: 'USER' })
      setShowAddModal(false)

      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <LayoutWrapper user={user} pageTitle="User Management">
      <ContentContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Users</h1>
              <p className="text-gray-600">Manage system users and roles</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              + Add User
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div
              className={`px-4 py-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="all">All Roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              Loading users...
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Devices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3">
                          <span className="font-medium text-gray-900">{u.name}</span>
                        </td>
                        <td className="px-6 py-3 text-gray-700">{u.email}</td>
                        <td className="px-6 py-3">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {u.department || '—'}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {u._count?.devices || 0}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              u.isActive
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={async () => {
                              if (window.confirm(`${u.isActive ? 'Deactivate' : 'Activate'} ${u.name}?`)) {
                                try {
                                  const res = await fetch('/api/users', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({
                                      userId: u.id,
                                      isActive: !u.isActive,
                                    }),
                                  })

                                  if (res.ok) {
                                    setUsers(
                                      users.map((usr) =>
                                        usr.id === u.id ? { ...usr, isActive: !usr.isActive } : usr
                                      )
                                    )
                                    setMessage({
                                      type: 'success',
                                      text: `User ${u.isActive ? 'deactivated' : 'activated'} successfully`,
                                    })
                                    setTimeout(() => setMessage(null), 3000)
                                  } else {
                                    throw new Error('Failed to update user')
                                  }
                                } catch (error: any) {
                                  setMessage({
                                    type: 'error',
                                    text: error.message || 'Failed to update user',
                                  })
                                }
                              }
                            }}
                            className="text-xs font-medium px-2 py-1 rounded transition"
                            style={{
                              color: u.isActive ? '#dc2626' : '#059669',
                              background: u.isActive ? '#fee2e2' : '#d1fae5',
                            }}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          <div className="text-sm text-gray-600">
            Showing <strong>{filteredUsers.length}</strong> of{' '}
            <strong>{users.length}</strong> users
          </div>
        </div>
      </ContentContainer>

      {/* Add User Modal */}
      {showAddModal && (
        <Modal
          title="Add New User"
          onClose={() => {
            setShowAddModal(false)
            setFormData({ name: '', email: '', roleCode: 'USER' })
            setMessage(null)
          }}
          actions={[
            {
              label: 'Cancel',
              onClick: () => {
                setShowAddModal(false)
                setFormData({ name: '', email: '', roleCode: 'USER' })
                setMessage(null)
              },
            },
            {
              label: 'Create User',
              onClick: handleAddUser,
              variant: 'primary',
              disabled: submitting || !formData.name || !formData.email,
            },
          ]}
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                placeholder="John Smith"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                placeholder="john@tyson.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Role *
              </label>
              <select
                value={formData.roleCode}
                onChange={(e) =>
                  setFormData({ ...formData, roleCode: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                required
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </LayoutWrapper>
  )
}
