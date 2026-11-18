import { NextResponse } from 'next/server'
import { settlementService } from '@/services/settlementService'
import { SettlementStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    // TODO: 인증 추가 (NextAuth v5 마이그레이션 후)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as SettlementStatus | null

    // 임시: 관리자의 경우 대기 목록 조회
    if (status === 'PENDING') {
      const settlements = await settlementService.getPendingSettlements()
      return NextResponse.json(settlements)
    }

    // 임시: 첫 번째 가맹점의 정산 내역 조회
    const merchant = await prisma.merchant.findFirst()

    if (!merchant) {
      return NextResponse.json(
        { error: '가맹점 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const settlements = await settlementService.getSettlements(
      merchant.id,
      status ? (status as SettlementStatus) : undefined
    )

    return NextResponse.json(settlements)
  } catch (error) {
    console.error('정산 내역 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '정산 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
