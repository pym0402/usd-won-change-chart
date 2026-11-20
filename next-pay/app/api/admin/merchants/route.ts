import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }

    const merchants = await prisma.merchant.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        payments: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            amount: true
          }
        },
        settlements: {
          select: {
            netAmount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 통계 계산
    const merchantsWithStats = merchants.map(merchant => {
      const totalRevenue = merchant.payments.reduce((sum, p) => sum + p.amount, 0)
      const pendingSettlements = merchant.settlements.filter(s => s.status === 'PENDING').length

      return {
        ...merchant,
        totalRevenue,
        pendingSettlements
      }
    })

    return NextResponse.json(merchantsWithStats)
  } catch (error) {
    console.error('가맹점 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '가맹점 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
