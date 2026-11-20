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

    const { id: applicationId } = await params

    const merchant = await merchantService.approveApplication(applicationId, user.id)

    return NextResponse.json(merchant)
  } catch (error) {
    console.error('가맹점 승인 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '가맹점 승인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
