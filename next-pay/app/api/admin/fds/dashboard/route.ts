import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fraudDetectionService } from '@/services/fraudDetectionService'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const userRoles = (session.user as any).roles
    if (!userRoles || !userRoles.includes('ADMIN')) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const stats = await fraudDetectionService.getStats()

    return NextResponse.json(stats)
  } catch (error) {
    console.error('FDS 대시보드 통계 조회 오류:', error)
    return NextResponse.json(
      { error: 'FDS 대시보드 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
