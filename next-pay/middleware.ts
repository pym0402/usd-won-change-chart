import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const path = request.nextUrl.pathname

  // 인증이 필요 없는 경로
  const publicPaths = ['/', '/api/auth']
  const isPublicPath = publicPaths.some(p => path.startsWith(p))

  if (!token && !isPublicPath) {
    // 인증되지 않은 사용자는 홈페이지로 리다이렉트
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (token) {
    const roles = (token as any).roles || []

    // 라우트 그룹별 권한 검증
    if (path.startsWith('/customer') && !roles.includes('CUSTOMER')) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (path.startsWith('/merchant') && !roles.includes('MERCHANT')) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (path.startsWith('/admin') && !roles.includes('ADMIN')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/customer/:path*', '/merchant/:path*', '/admin/:path*', '/api/:path*']
}
