import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paymentService } from '@/services/paymentService'
import { PaymentStatus } from '@prisma/client'

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
    const userRole = (session.user as any).role

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as PaymentStatus | null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 역할 확인 (CUSTOMER 또는 MERCHANT)
    if (userRole !== 'CUSTOMER' && userRole !== 'MERCHANT') {
      return NextResponse.json(
        { error: '결제 내역 조회 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const result = await paymentService.getPayments(
      userId,
      userRole.toLowerCase() as 'customer' | 'merchant',
      status || undefined,
      limit,
      offset
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('결제 내역 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
