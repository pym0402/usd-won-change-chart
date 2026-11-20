import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const user = await authorize('MERCHANT')
    if (user instanceof NextResponse) return user

    const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } })

    if (!merchant) {
      return NextResponse.json(
        { error: '가맹점 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const settlements = await prisma.merchantSettlement.findMany({
      where: { merchantId: merchant.id },
      include: {
        payment: true
      }
    })

    const totalGrossAmount = settlements.reduce((sum, s) => sum + s.grossAmount, 0)
    const totalCommission = settlements.reduce((sum, s) => sum + s.commission, 0)
    const totalNetAmount = settlements.reduce((sum, s) => sum + s.netAmount, 0)
    const pendingCount = settlements.filter(s => s.status === 'PENDING').length
    const completedCount = settlements.filter(s => s.status === 'COMPLETED').length

    return NextResponse.json({
      totalGrossAmount,
      totalCommission,
      totalNetAmount,
      pendingCount,
      completedCount,
      commissionRate: merchant.commissionRate
    })
  } catch (error) {
    console.error('정산 요약 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '정산 요약 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
