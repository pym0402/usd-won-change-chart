import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { settlementService } from '@/services/settlementService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorize('MERCHANT', 'ADMIN')
    if (user instanceof NextResponse) return user

    const { id: settlementId } = await params
    const settlement = await settlementService.getSettlement(settlementId)

    if (!user.roles.includes('ADMIN') && settlement.merchant.userId !== user.id) {
      return NextResponse.json({ error: '정산 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(settlement)
  } catch (error) {
    console.error('정산 상세 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '정산 상세 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
