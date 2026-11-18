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

    const userId = (session.user as any).id
    const body = await request.json()
    const { merchantId, amount, paymentMethodId, pointAmount } = body

    if (!merchantId || !amount) {
      return NextResponse.json(
        { error: 'merchantId와 amount는 필수입니다.' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: '결제 금액은 0보다 커야 합니다.' },
        { status: 400 }
      )
    }

    const result = await paymentService.createPaymentIntent(
      merchantId,
      userId,
      amount,
      paymentMethodId,
      pointAmount || 0
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Payment Intent 생성 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment Intent 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
