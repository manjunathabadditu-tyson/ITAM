// Client-side auth utilities
// Server-only functions are in auth.server.ts

export const ROLE_CODES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const

export function hasRole(userRole: string, requiredRole: string): boolean {
  return userRole.toUpperCase().includes(requiredRole.toUpperCase())
}

export function hasAnyRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.some(role => hasRole(userRole, role))
}

export function isAdmin(role: string): boolean {
  return hasRole(role, ROLE_CODES.ADMIN)
}

export function isUser(role: string): boolean {
  return hasRole(role, ROLE_CODES.USER)
}
