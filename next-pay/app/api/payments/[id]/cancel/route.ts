import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { paymentService } from '@/services/paymentService'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorize('CUSTOMER', 'MERCHANT')
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const { reason } = body
    const { id: paymentId } = await params

    const ownedPayment = await prisma.payment.findFirst({
      where: { id: paymentId, OR: [
          ...(user.roles.includes('CUSTOMER') ? [{ customerId: user.id }] : []),
          ...(user.roles.includes('MERCHANT') ? [{ merchant: { userId: user.id } }] : []),
        ] },
      select: { id: true }
    })
    if (!ownedPayment) {
      return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

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
