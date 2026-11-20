import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { paymentService } from '@/services/paymentService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorize('CUSTOMER', 'MERCHANT')
    if (user instanceof NextResponse) return user

    const { id: paymentId } = await params
    const payment = await paymentService.getPayment(paymentId)

    const canRead = (user.roles.includes('CUSTOMER') && payment.customerId === user.id)
      || (user.roles.includes('MERCHANT') && payment.merchant.userId === user.id)
    if (!canRead) {
      return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('결제 상세 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 상세 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
