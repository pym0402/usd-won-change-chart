import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MerchantStatus } from '@prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const userRoles = (session.user as any).roles
    if (!userRoles || !userRoles.includes('ADMIN')) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { status } = await request.json()

    if (!status || !['APPROVED', 'SUSPENDED'].includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태입니다.' }, { status: 400 })
    }

    // 가맹점 조회
    const merchant = await prisma.merchant.findUnique({
      where: { id: params.id },
      include: {
        user: true
      }
    })

    if (!merchant) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 상태 업데이트
    const updatedMerchant = await prisma.merchant.update({
      where: { id: params.id },
      data: {
        status: status as MerchantStatus
      },
      include: {
        user: true
      }
    })

    return NextResponse.json(updatedMerchant)
  } catch (error) {
    console.error('가맹점 상태 업데이트 오류:', error)
    return NextResponse.json(
      { error: '가맹점 상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
