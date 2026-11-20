import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'
import { normalizeRoles } from './roles'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = credentials.email
        const password = credentials.password

        if (typeof email !== 'string' || !email || typeof password !== 'string' || !password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.')
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { roles: { include: { role: true } } }
        })

        if (!user) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }

        const isPasswordValid = !!user.password && await bcrypt.compare(password, user.password)

        const temporary = !isPasswordValid && !!user.temporaryPasswordHash &&
          !!user.temporaryPasswordExpiresAt && user.temporaryPasswordExpiresAt > new Date() &&
          await bcrypt.compare(password, user.temporaryPasswordHash)

        if (!isPasswordValid && !temporary) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }

        const userRoles = normalizeRoles(user.roles.map(({ role }) => role.name))

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles: temporary ? [] : userRoles,
          passwordVersion: user.passwordVersion,
          temporaryPasswordExpiresAt: temporary ? user.temporaryPasswordExpiresAt?.getTime() : undefined
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roles = normalizeRoles(user.roles)
        token.passwordVersion = user.passwordVersion
        token.temporaryPasswordExpiresAt = user.temporaryPasswordExpiresAt
      }
      if (token.id && (token.passwordVersion !== undefined || normalizeRoles(token.roles).length)) {
        const account = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            passwordVersion: true,
            temporaryPasswordExpiresAt: true,
            roles: { select: { role: { select: { name: true } } } }
          },
        })
        if (!account || (token.passwordVersion ?? 0) !== account.passwordVersion) return null
        if (token.temporaryPasswordExpiresAt !== undefined &&
            (token.temporaryPasswordExpiresAt <= Date.now() ||
              account.temporaryPasswordExpiresAt?.getTime() !== token.temporaryPasswordExpiresAt)) return null
        token.roles = token.temporaryPasswordExpiresAt === undefined
          ? normalizeRoles(account.roles.map(({ role }) => role.name))
          : []
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        if (typeof token.id === 'string') session.user.id = token.id
        session.user.roles = normalizeRoles(token.roles)
        session.user.mustChangePassword = token.temporaryPasswordExpiresAt !== undefined
      }
      return session
    }
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
})
