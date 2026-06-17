'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LayoutWrapper from '@/components/LayoutWrapper'
import ContentContainer from '@/components/ContentContainer'
import Modal from '@/components/Modal'
import Pagination from '@/components/Pagination'
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

interface Device {
  id: string
  assetTag: string
  type: string
  model: string
  serialNum: string
  status: string
  location?: string
  warrantyEnd?: string
  condition?: string
}

const ROLES = ['ADMIN', 'USER']

export default function UsersPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDevicesModal, setShowDevicesModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userDevices, setUserDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [loadingDevices, setLoadingDevices] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleCode: 'USER',
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    roleCode: 'USER',
  })
  const [submitting, setSubmitting] = useState(false)
  const [returning, setReturning] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalUsers, setTotalUsers] = useState(0)
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

        const offset = (currentPage - 1) * pageSize
        const usersRes = await fetch(`/api/users?offset=${offset}&limit=${pageSize}`)
        const { users: fetchedUsers, total } = await usersRes.json()
        setUsers(fetchedUsers)
        setTotalUsers(total)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load users:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router, currentPage, pageSize])

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

  const handleViewDevices = async (u: User) => {
    setSelectedUser(u)
    setLoadingDevices(true)
    try {
      const res = await fetch(`/api/users/${u.id}/devices`)
      if (res.ok) {
        const { devices } = await res.json()
        setUserDevices(devices)
      } else {
        throw new Error('Failed to load devices')
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoadingDevices(false)
      setShowDevicesModal(true)
    }
  }

  const handleReturnDevice = async () => {
    if (!selectedDevice || !selectedUser) return

    setReturning(true)
    try {
      const res = await fetch(`/api/assets/${selectedDevice.id}/deallocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: 'Admin return from user devices modal' }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to return device')
      }

      setUserDevices(userDevices.filter((d) => d.id !== selectedDevice.id))
      setSelectedDevice(null)

      // Update the user's device count in the main list
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                _count: {
                  devices: Math.max(0, (u._count?.devices || 0) - 1),
                },
              }
            : u
        )
      )

      setMessage({ type: 'success', text: 'Device returned successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setReturning(false)
    }
  }

  const handleOpenEditModal = (u: User) => {
    setSelectedUser(u)
    setEditFormData({
      name: u.name,
      email: u.email,
      roleCode: u.role,
    })
    setShowEditModal(true)
  }

  const handleEditUser = async () => {
    if (!selectedUser || !editFormData.name || !editFormData.email) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUser.id,
          name: editFormData.name,
          email: editFormData.email,
          roleCode: editFormData.roleCode,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update user')
      }

      const updatedUser = await res.json()
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
              }
            : u
        )
      )
      setMessage({ type: 'success', text: 'User updated successfully' })
      setShowEditModal(false)
      setSelectedUser(null)
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
                          <button
                            onClick={() => handleViewDevices(u)}
                            className="text-primary hover:text-primary-dark hover:underline font-medium transition"
                          >
                            {u._count?.devices || 0}
                          </button>
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="text-xs font-medium px-2 py-1 rounded transition text-blue-700 bg-blue-50 hover:bg-blue-100"
                            >
                              Edit
                            </button>
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
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalUsers / pageSize)}
            totalItems={totalUsers}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
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

      {/* User Devices Modal */}
      {showDevicesModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                Devices for {selectedUser.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{selectedUser.email}</p>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {loadingDevices ? (
                <div className="text-center py-8 text-gray-500">Loading devices...</div>
              ) : userDevices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No devices assigned to this user
                </div>
              ) : (
                <div className="space-y-3">
                  {userDevices.map((device) => (
                    <div
                      key={device.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">
                              {device.assetTag}
                            </span>
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {device.type}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Model:</span> {device.model || '-'}
                            </div>
                            <div>
                              <span className="font-medium">Serial:</span> {device.serialNum}
                            </div>
                            <div>
                              <span className="font-medium">Location:</span> {device.location || '-'}
                            </div>
                            <div>
                              <span className="font-medium">Warranty:</span>{' '}
                              {device.warrantyEnd || '-'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedDevice(device)}
                          className="px-3 py-1 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded transition"
                        >
                          Return
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowDevicesModal(false)
                  setSelectedUser(null)
                  setUserDevices([])
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Device Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Return Device</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedDevice.assetTag}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Model:</strong> {selectedDevice.model || '-'}<br/>
                  <strong>Serial:</strong> {selectedDevice.serialNum}
                </p>
              </div>
              <p className="text-sm text-gray-700">
                This will return <strong>{selectedDevice.assetTag}</strong> to Available status.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setSelectedDevice(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnDevice}
                disabled={returning}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition disabled:bg-gray-400"
              >
                {returning ? 'Returning...' : 'Return Device'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <Modal
          title={`Edit User: ${selectedUser.name}`}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
            setMessage(null)
          }}
          actions={[
            {
              label: 'Cancel',
              onClick: () => {
                setShowEditModal(false)
                setSelectedUser(null)
                setMessage(null)
              },
            },
            {
              label: 'Update User',
              onClick: handleEditUser,
              variant: 'primary',
              disabled: submitting || !editFormData.name || !editFormData.email,
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
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
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
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
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
                value={editFormData.roleCode}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, roleCode: e.target.value })
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
