import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { settlementService } from '@/services/settlementService'
import { SettlementStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const user = await authorize('MERCHANT', 'ADMIN')
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(request.url)
    const status = Object.values(SettlementStatus).find((value) => value === searchParams.get('status'))
    if (searchParams.has('status') && !status) {
      return NextResponse.json({ error: '유효하지 않은 정산 상태입니다.' }, { status: 400 })
    }

    const scope = searchParams.get('scope') ?? (user.roles.includes('ADMIN') ? 'admin' : 'merchant')
    if (scope === 'admin' && user.roles.includes('ADMIN') && status === SettlementStatus.PENDING) {
      return NextResponse.json(await settlementService.getPendingSettlements())
    }
    if (scope !== 'merchant' || !user.roles.includes('MERCHANT')) {
      return NextResponse.json({ error: '정산 내역 조회 권한이 없습니다.' }, { status: 403 })
    }

    const merchant = await prisma.merchant.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (!merchant) {
      return NextResponse.json({ error: '가맹점 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(await settlementService.getSettlements(merchant.id, status))
  } catch (error) {
    console.error('정산 내역 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '정산 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
