import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { settlementService } from '@/services/settlementService'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const { transactionId } = body
    const { id: settlementId } = await params

    const settlement = await settlementService.approveSettlement(settlementId, transactionId)

    return NextResponse.json(settlement)
  } catch (error) {
    console.error('정산 승인 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '정산 승인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
