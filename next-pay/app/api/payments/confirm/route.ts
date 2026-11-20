import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { paymentService } from '@/services/paymentService'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const user = await authorize('CUSTOMER')
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const { paymentId, paymentMethodId } = body

    if (typeof paymentId !== 'string' || !paymentId) {
      return NextResponse.json(
        { error: 'paymentId는 필수입니다.' },
        { status: 400 }
      )
    }

    const ownedPayment = await prisma.payment.findFirst({
      where: { id: paymentId, customerId: user.id },
      select: { id: true }
    })
    if (!ownedPayment) {
      return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다.' }, { status: 404 })
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
