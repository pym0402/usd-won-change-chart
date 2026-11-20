import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const settlements = await prisma.merchantSettlement.findMany({
      where: {
        ...(status && { status: status as any })
      },
      include: {
        payment: {
          include: {
            customer: true
          }
        },
        merchant: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const escapeCsv = (value: any) => {
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csv = [
      ['ID', '가맹점', '가맹점 이메일', '총 금액', '수수료', '정산 금액', '상태', '결제 ID', '고객', '생성일', '정산일'].map(escapeCsv).join(','),
      ...settlements.map((s: any) => [
        s.id,
        s.merchant.businessName,
        s.merchant.user.email,
        s.grossAmount,
        s.commission,
        s.netAmount,
        s.status,
        s.paymentId,
        s.payment.customer?.name || s.payment.customer?.email || '-',
        s.createdAt.toISOString(),
        s.settledAt?.toISOString() || '-'
      ].map(escapeCsv).join(','))
    ].join('\n')

    // UTF-8 BOM 추가 (한글 깨짐 방지)
    const bom = '\uFEFF'
    const csvWithBom = bom + csv

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="admin-settlements-${Date.now()}.csv"`
      }
    })
  } catch (error) {
    console.error('관리자 CSV 내보내기 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'CSV 내보내기 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
