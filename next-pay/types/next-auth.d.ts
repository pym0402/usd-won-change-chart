import type { DefaultSession } from 'next-auth'
import type { UserRole } from '@/lib/roles'

declare module 'next-auth' {
  interface User {
    roles?: UserRole[]
    passwordVersion?: number
    temporaryPasswordExpiresAt?: number
  }

  interface Session {
    user: DefaultSession['user'] & {
      id?: string
      roles: UserRole[]
      mustChangePassword?: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    roles?: UserRole[]
    passwordVersion?: number
    temporaryPasswordExpiresAt?: number
  }
}
