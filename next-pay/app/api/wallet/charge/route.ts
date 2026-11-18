import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { walletService } from '@/services/walletService'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, description, referenceId } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: '유효한 충전 금액을 입력해주세요.' },
        { status: 400 }
      )
    }

    const userId = (session.user as any).id
    const result = await walletService.chargePoints({
      userId,
      amount,
      description,
      referenceId
    })

    return NextResponse.json({
      message: '포인트 충전이 완료되었습니다.',
      wallet: result.wallet,
      transaction: result.transaction
    })
  } catch (error) {
    console.error('포인트 충전 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '포인트 충전 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
