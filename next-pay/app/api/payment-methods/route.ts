import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paymentMethodService } from '@/services/paymentMethodService'
import { PaymentMethodType } from '@prisma/client'

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
    const { type, paymentMethodId, bankName, bankAccount, isDefault } = body

    if (!type) {
      return NextResponse.json(
        { error: '결제 수단 유형(type)은 필수입니다.' },
        { status: 400 }
      )
    }

    let paymentMethod

    if (type === PaymentMethodType.CARD) {
      if (!paymentMethodId) {
        return NextResponse.json(
          { error: '카드 결제 수단 등록을 위해 paymentMethodId가 필요합니다.' },
          { status: 400 }
        )
      }

      paymentMethod = await paymentMethodService.createCardPaymentMethod(
        userId,
        paymentMethodId,
        isDefault || false
      )
    } else if (type === PaymentMethodType.BANK_ACCOUNT) {
      if (!bankName || !bankAccount) {
        return NextResponse.json(
          { error: '계좌 결제 수단 등록을 위해 bankName과 bankAccount가 필요합니다.' },
          { status: 400 }
        )
      }

      paymentMethod = await paymentMethodService.createBankAccountPaymentMethod(
        userId,
        bankName,
        bankAccount,
        isDefault || false
      )
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 결제 수단 유형입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(paymentMethod, { status: 201 })
  } catch (error) {
    console.error('결제 수단 등록 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 수단 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const paymentMethods = await paymentMethodService.getPaymentMethods(userId)

    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error('결제 수단 목록 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 수단 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
