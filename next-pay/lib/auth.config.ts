import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/auth/signin',
  },
  providers: [],
} satisfies NextAuthConfig
