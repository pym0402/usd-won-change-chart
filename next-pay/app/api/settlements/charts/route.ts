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
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const settlements = await prisma.merchantSettlement.findMany({
      where: {
        merchantId: merchant.id,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        payment: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const dailyData = new Map<string, {
      date: string
      grossAmount: number
      netAmount: number
      commission: number
    }>()

    settlements.forEach(settlement => {
      const dateKey = settlement.createdAt.toISOString().split('T')[0]
      const existing = dailyData.get(dateKey) || {
        date: dateKey,
        grossAmount: 0,
        netAmount: 0,
        commission: 0
      }

      existing.grossAmount += settlement.grossAmount
      existing.netAmount += settlement.netAmount
      existing.commission += settlement.commission

      dailyData.set(dateKey, existing)
    })

    const chartData = Array.from(dailyData.values())

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('정산 차트 데이터 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '정산 차트 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
