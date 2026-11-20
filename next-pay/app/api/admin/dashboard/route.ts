import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { settlementService } from '@/services/settlementService'

export async function GET(request: Request) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    let startDate: Date | undefined
    let endDate: Date | undefined

    if (startDateParam) {
      startDate = new Date(startDateParam)
    }
    if (endDateParam) {
      endDate = new Date(endDateParam)
    }

    const stats = await settlementService.getDashboardStats(startDate, endDate)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '대시보드 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
