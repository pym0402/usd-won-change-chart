import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { normalizeRoles } from './lib/roles'

export async function proxy(request: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? request.url
  const token = secret
    ? await getToken({ req: request, secret, secureCookie: authUrl.startsWith('https:') })
    : null
  const path = request.nextUrl.pathname
  if (token?.temporaryPasswordExpiresAt !== undefined) {
    if (path.startsWith('/api/auth/')) return NextResponse.next()
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: '먼저 비밀번호를 변경해 주세요.' }, { status: 403 })
    }

    const destination = token.temporaryPasswordExpiresAt > Date.now() ? '/auth/change-password' : '/auth/signin'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  if (path === '/' || path.startsWith('/api/')) return NextResponse.next()
  const roles = normalizeRoles(token?.roles)
  const section = path.split('/')[1]

  if (
    (section === 'customer' && roles.includes('CUSTOMER')) ||
    (section === 'merchant' && roles.includes('MERCHANT')) ||
    (section === 'admin' && roles.includes('ADMIN'))
  ) {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL('/', request.url))
}

export const config = {
  matcher: ['/', '/customer/:path*', '/merchant/:path*', '/admin/:path*', '/api/:path*']
}
