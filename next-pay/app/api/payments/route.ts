import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { prisma } from '@/lib/prisma'
import { paymentService } from '@/services/paymentService'
import { PaymentStatus } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const user = await authorize('CUSTOMER', 'MERCHANT')
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') ?? (user.roles.includes('CUSTOMER') ? 'customer' : 'merchant')
    if (scope !== 'customer' && scope !== 'merchant') {
      return NextResponse.json({ error: '유효하지 않은 결제 내역 범위입니다.' }, { status: 400 })
    }
    if (!user.roles.includes(scope === 'customer' ? 'CUSTOMER' : 'MERCHANT')) {
      return NextResponse.json({ error: '결제 내역 조회 권한이 없습니다.' }, { status: 403 })
    }

    const status = Object.values(PaymentStatus).find((value) => value === searchParams.get('status'))
    if (searchParams.has('status') && !status) {
      return NextResponse.json({ error: '유효하지 않은 결제 상태입니다.' }, { status: 400 })
    }

    const limit = Number(searchParams.get('limit') ?? 50)
    const offset = Number(searchParams.get('offset') ?? 0)
    if (!Number.isSafeInteger(limit) || limit <= 0 || !Number.isSafeInteger(offset) || offset < 0) {
      return NextResponse.json({ error: '유효하지 않은 페이지 범위입니다.' }, { status: 400 })
    }

    const merchant = scope === 'merchant'
      ? await prisma.merchant.findUnique({ where: { userId: user.id }, select: { id: true } })
      : null
    if (scope === 'merchant' && !merchant) {
      return NextResponse.json({ error: '가맹점 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(await paymentService.getPayments(merchant?.id ?? user.id, scope, status, limit, offset))
  } catch (error) {
    console.error('결제 내역 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
