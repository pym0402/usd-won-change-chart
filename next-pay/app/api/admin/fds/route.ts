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

    const searchParams = request.nextUrl.searchParams
    const minRiskScore = searchParams.get('minRiskScore')
    const filter = searchParams.get('filter') // 'all', 'blocked', 'review', 'allowed'

    let fraudDetections

    if (filter === 'blocked') {
      fraudDetections = await fraudDetectionService.getBlockedPayments()
    } else if (filter === 'review') {
      fraudDetections = await fraudDetectionService.getReviewPendingPayments()
    } else {
      fraudDetections = await fraudDetectionService.getAllFraudDetections(
        minRiskScore ? parseFloat(minRiskScore) : undefined
      )
    }

    return NextResponse.json(fraudDetections)
  } catch (error) {
    console.error('FDS 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'FDS 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
