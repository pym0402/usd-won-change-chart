import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { fraudDetectionService } from '@/services/fraudDetectionService'

export async function GET(request: NextRequest) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

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
