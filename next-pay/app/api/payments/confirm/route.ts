import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paymentService } from '@/services/paymentService'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { paymentId, paymentMethodId } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId는 필수입니다.' },
        { status: 400 }
      )
    }

    const payment = await paymentService.confirmPayment(paymentId, paymentMethodId)

    return NextResponse.json(payment)
  } catch (error) {
    console.error('결제 승인 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 승인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
