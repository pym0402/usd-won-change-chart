import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const merchant = await prisma.merchant.findFirst({
      where: {
        userId: session.user.id
      }
    })

    if (!merchant) {
      return NextResponse.json({ error: '가맹점 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const settlements = await prisma.merchantSettlement.findMany({
      where: {
        merchantId: merchant.id,
        ...(status && { status: status as any })
      },
      include: {
        payment: {
          include: {
            customer: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const csv = [
      ['ID', '가맹점', '총 금액', '수수료', '정산 금액', '상태', '결제 ID', '고객', '생성일', '정산일'].join(','),
      ...settlements.map((s: any) => [
        s.id,
        merchant.businessName,
        s.grossAmount,
        s.commission,
        s.netAmount,
        s.status,
        s.paymentId,
        s.payment.customer?.name || s.payment.customer?.email || '-',
        s.createdAt.toISOString(),
        s.settledAt?.toISOString() || '-'
      ].join(','))
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="settlements-${Date.now()}.csv"`
      }
    })
  } catch (error) {
    console.error('CSV 내보내기 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'CSV 내보내기 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
