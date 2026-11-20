import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { prisma } from '@/lib/prisma'
import { MerchantStatus } from '@prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

    const { id } = await params
    const { status }: { status?: unknown } = await request.json()

    if (status !== MerchantStatus.APPROVED && status !== MerchantStatus.SUSPENDED) {
      return NextResponse.json({ error: '유효하지 않은 상태입니다.' }, { status: 400 })
    }

    // 가맹점 조회
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    })

    if (!merchant) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 상태 업데이트
    const updatedMerchant = await prisma.merchant.update({
      where: { id },
      data: {
        status
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
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
