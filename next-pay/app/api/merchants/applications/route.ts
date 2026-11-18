import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { merchantService } from '@/services/merchantService'
import { ApplicationStatus } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role

    // 관리자만 접근 가능
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ApplicationStatus | null

    const applications = await merchantService.getApplications(
      status ? (status as ApplicationStatus) : undefined
    )

    return NextResponse.json(applications)
  } catch (error) {
    console.error('가맹점 신청 목록 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '가맹점 신청 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
