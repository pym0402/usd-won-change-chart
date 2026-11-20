import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { walletService } from '@/services/walletService'

export async function GET(request: Request) {
  try {
    const user = await authorize('ADMIN')
    if (user instanceof NextResponse) return user

    const result = await walletService.validateLedgerIntegrity()

    return NextResponse.json(result)
  } catch (error) {
    console.error('원장 무결성 검증 오류:', error)
    return NextResponse.json(
      {
        isValid: false,
        error: error instanceof Error ? error.message : '원장 무결성 검증 중 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}
