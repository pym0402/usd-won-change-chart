import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { merchantService } from '@/services/merchantService'
import { ApplicationStatus } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

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
