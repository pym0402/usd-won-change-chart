import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { merchantService } from '@/services/merchantService'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const adminId = (session.user as any).id
    const userRole = (session.user as any).role

    // 관리자만 접근 가능
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { id: applicationId } = await params

    const merchant = await merchantService.approveApplication(applicationId, adminId)

    return NextResponse.json(merchant)
  } catch (error) {
    console.error('가맹점 승인 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '가맹점 승인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
