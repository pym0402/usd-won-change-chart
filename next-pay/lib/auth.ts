import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'

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
        const email = credentials?.email as string
        const password = credentials?.password as string

        console.log('[Auth] 로그인 시도:', { email })

        if (!email || !password) {
          console.log('[Auth] 이메일 또는 비밀번호 누락')
          throw new Error('이메일과 비밀번호를 입력해주세요.')
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { roles: { include: { role: true } } }
        })

        console.log('[Auth] DB에서 찾은 사용자:', user ? { id: user.id, email: user.email, hasPassword: !!user.password } : null)

        if (!user || !user.password) {
          console.log('[Auth] 사용자를 찾을 수 없거나 비밀번호가 없음')
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        )

        console.log('[Auth] 비밀번호 검증 결과:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('[Auth] 비밀번호 불일치')
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }

        const userRoles = user.roles.map((ur: any) => ur.role.name)
        console.log('[Auth] 로그인 성공:', { id: user.id, email: user.email, roles: userRoles })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles: userRoles
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
        token.roles = (user as any).roles
        console.log('[Auth JWT] 토큰 생성:', { id: token.id, roles: token.roles })
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).roles = token.roles as string[]
        console.log('[Auth Session] 세션 생성:', {
          id: (session.user as any).id,
          email: session.user.email,
          roles: (session.user as any).roles
        })
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
})
