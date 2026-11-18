import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { walletService } from '@/services/walletService'

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
    const wallet = await walletService.getWallet(userId)

    return NextResponse.json(wallet)
  } catch (error) {
    console.error('지갑 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '지갑 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
