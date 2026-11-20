import { NextRequest, NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { fraudDetectionService } from '@/services/fraudDetectionService'
import { FraudAction } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

    const { id } = await params
    const { action }: { action?: unknown } = await request.json()

    if (action !== FraudAction.ALLOW && action !== FraudAction.BLOCK && action !== FraudAction.REVIEW) {
      return NextResponse.json({ error: '유효하지 않은 조치 타입입니다.' }, { status: 400 })
    }

    const fraudDetection = await fraudDetectionService.takeAction(
      id,
      action,
      user.id
    )

    return NextResponse.json(fraudDetection)
  } catch (error) {
    console.error('FDS 조치 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'FDS 조치 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
