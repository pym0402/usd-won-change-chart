import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fraudDetectionService } from '@/services/fraudDetectionService'
import { FraudAction } from '@prisma/client'

export async function POST(
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

    const { action } = await request.json()

    if (!action || !['ALLOW', 'BLOCK', 'REVIEW'].includes(action)) {
      return NextResponse.json({ error: '유효하지 않은 조치 타입입니다.' }, { status: 400 })
    }

    const fraudDetection = await fraudDetectionService.takeAction(
      params.id,
      action as FraudAction,
      session.user.id
    )

    return NextResponse.json(fraudDetection)
  } catch (error: any) {
    console.error('FDS 조치 오류:', error)
    return NextResponse.json(
      { error: error.message || 'FDS 조치 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
