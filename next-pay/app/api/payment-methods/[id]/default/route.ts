import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paymentMethodService } from '@/services/paymentMethodService'

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

    const userId = (session.user as any).id
    const { id: paymentMethodId } = await params

    const paymentMethod = await paymentMethodService.setDefaultPaymentMethod(userId, paymentMethodId)

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error('기본 결제 수단 설정 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '기본 결제 수단 설정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
