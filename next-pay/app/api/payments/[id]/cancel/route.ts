import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paymentService } from '@/services/paymentService'

export async function POST(
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

    const body = await request.json()
    const { reason } = body
    const { id: paymentId } = await params

    const payment = await paymentService.cancelPayment(paymentId, reason)

    return NextResponse.json(payment)
  } catch (error) {
    console.error('결제 취소 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
