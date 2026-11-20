import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { paymentService } from '@/services/paymentService'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const user = await authorize('CUSTOMER')
    if (user instanceof NextResponse) return user

    const userId = user.id
    const body = await request.json()
    const { merchantId, amount, paymentMethodId, pointAmount } = body

    if (typeof merchantId !== 'string' || !merchantId || !amount) {
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

    const merchant = await prisma.merchant.findFirst({
      where: { id: merchantId, status: 'APPROVED' },
      select: { id: true },
    })
    if (!merchant) return NextResponse.json({ error: '결제할 수 있는 가맹점을 선택해 주세요.' }, { status: 400 })

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
