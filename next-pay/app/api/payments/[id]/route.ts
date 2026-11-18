import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paymentService } from '@/services/paymentService'

export async function GET(
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

    const { id: paymentId } = await params
    const payment = await paymentService.getPayment(paymentId)

    return NextResponse.json(payment)
  } catch (error) {
    console.error('결제 상세 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 상세 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
