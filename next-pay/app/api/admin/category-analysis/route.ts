import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = endDateParam ? new Date(endDateParam) : new Date()

    // 가맹점별 거래액 집계
    const merchantTransactions = await prisma.payment.groupBy({
      by: ['merchantId'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // 가맹점 정보 조회
    const merchantIds = merchantTransactions.map(mt => mt.merchantId)
    const merchants = await prisma.merchant.findMany({
      where: {
        id: { in: merchantIds }
      },
      select: {
        id: true,
        businessName: true,
        status: true
      }
    })

    // 데이터 병합 및 카테고리 할당 (가맹점 비즈니스명 기반)
    const categoryData = merchantTransactions.map(mt => {
      const merchant = merchants.find(m => m.id === mt.merchantId)
      const businessName = merchant?.businessName || '알 수 없음'

      // 비즈니스명 기반 카테고리 분류 (간단한 규칙)
      let category = '기타'
      if (businessName.includes('식당') || businessName.includes('카페') || businessName.includes('맛집')) {
        category = '식음료'
      } else if (businessName.includes('쇼핑') || businessName.includes('마트') || businessName.includes('편의점')) {
        category = '쇼핑'
      } else if (businessName.includes('교육') || businessName.includes('학원')) {
        category = '교육'
      } else if (businessName.includes('서비스') || businessName.includes('미용')) {
        category = '서비스'
      } else if (businessName.includes('병원') || businessName.includes('약국') || businessName.includes('건강')) {
        category = '의료'
      } else if (businessName.includes('여행') || businessName.includes('호텔') || businessName.includes('숙박')) {
        category = '여행/숙박'
      } else if (businessName.includes('엔터') || businessName.includes('게임') || businessName.includes('영화')) {
        category = '엔터테인먼트'
      }

      return {
        merchantId: mt.merchantId,
        merchantName: businessName,
        category,
        amount: mt._sum.amount || 0,
        transactionCount: mt._count.id
      }
    })

    // 카테고리별 집계
    const categorySummary = categoryData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          category: item.category,
          totalAmount: 0,
          transactionCount: 0,
          merchantCount: 0,
          merchants: []
        }
      }
      acc[item.category].totalAmount += item.amount
      acc[item.category].transactionCount += item.transactionCount
      acc[item.category].merchantCount += 1
      acc[item.category].merchants.push({
        name: item.merchantName,
        amount: item.amount,
        transactionCount: item.transactionCount
      })
      return acc
    }, {} as Record<string, any>)

    const totalAmount = Object.values(categorySummary).reduce((sum: number, cat: any) => sum + cat.totalAmount, 0)

    // 결과 변환
    const result = Object.values(categorySummary).map((cat: any) => ({
      category: cat.category,
      totalAmount: cat.totalAmount,
      transactionCount: cat.transactionCount,
      merchantCount: cat.merchantCount,
      percentage: totalAmount > 0 ? (cat.totalAmount / totalAmount * 100).toFixed(2) : '0',
      topMerchants: cat.merchants
        .sort((a: any, b: any) => b.amount - a.amount)
        .slice(0, 5)
    })).sort((a: any, b: any) => b.totalAmount - a.totalAmount)

    return NextResponse.json({
      summary: result,
      totalAmount,
      period: {
        startDate,
        endDate
      }
    })
  } catch (error) {
    console.error('카테고리별 거래액 분석 오류:', error)
    return NextResponse.json(
      { error: '카테고리별 거래액 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
