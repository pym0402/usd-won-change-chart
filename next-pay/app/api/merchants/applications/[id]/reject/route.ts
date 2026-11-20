import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { merchantService } from '@/services/merchantService'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: '거부 사유(reason)는 필수입니다.' },
        { status: 400 }
      )
    }

    const { id: applicationId } = await params

    const merchant = await merchantService.rejectApplication(applicationId, user.id, reason)

    return NextResponse.json(merchant)
  } catch (error) {
    console.error('가맹점 거부 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '가맹점 거부 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
