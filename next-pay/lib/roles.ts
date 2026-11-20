const roles = ['CUSTOMER', 'MERCHANT', 'ADMIN'] as const

export type UserRole = (typeof roles)[number]

export function isUserRole(value: unknown): value is UserRole {
  return roles.some((role) => role === value)
}

export function normalizeRoles(value: unknown): UserRole[] {
  return Array.isArray(value) ? [...new Set(value.filter(isUserRole))] : []
}
