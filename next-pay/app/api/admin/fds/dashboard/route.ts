import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { fraudDetectionService } from '@/services/fraudDetectionService'

export async function GET(request: NextRequest) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

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
