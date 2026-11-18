import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TransactionType } from '@prisma/client'

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
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as TransactionType | null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 지갑 조회
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: '지갑을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 거래 내역 조회 (필터링 포함)
    const where: any = {
      walletId: wallet.id
    }

    if (type && Object.values(TransactionType).includes(type)) {
      where.type = type
    }

    const transactions = await prisma.pointTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // 전체 개수 조회
    const total = await prisma.pointTransaction.count({ where })

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('포인트 거래 내역 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '거래 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
