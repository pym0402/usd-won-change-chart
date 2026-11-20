import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate
        }
      },
      include: {
        settlement: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const dailyData = new Map<string, {
      date: string
      gmv: number
      transactions: number
      commission: number
      settlements: number
    }>()

    payments.forEach(payment => {
      const dateKey = payment.createdAt.toISOString().split('T')[0]
      const existing = dailyData.get(dateKey) || {
        date: dateKey,
        gmv: 0,
        transactions: 0,
        commission: 0,
        settlements: 0
      }

      existing.gmv += payment.amount
      existing.transactions += 1

      if (payment.settlement) {
        existing.commission += payment.settlement.commission
        existing.settlements += 1
      }

      dailyData.set(dateKey, existing)
    })

    const gmvData = Array.from(dailyData.values()).map(item => ({
      date: item.date,
      gmv: item.gmv,
      transactions: item.transactions
    }))

    const revenueData = Array.from(dailyData.values()).map(item => ({
      date: item.date,
      commission: item.commission,
      settlements: item.settlements
    }))

    return NextResponse.json({
      gmvData,
      revenueData
    })
  } catch (error) {
    console.error('차트 데이터 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '차트 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
