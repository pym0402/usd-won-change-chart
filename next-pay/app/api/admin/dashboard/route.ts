import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { settlementService } from '@/services/settlementService'

export async function GET(request: Request) {
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
