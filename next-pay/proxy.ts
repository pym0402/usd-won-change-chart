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
  const roles = normalizeRoles(token?.roles)
  const section = request.nextUrl.pathname.split('/')[1]

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
  matcher: ['/customer/:path*', '/merchant/:path*', '/admin/:path*']
}
