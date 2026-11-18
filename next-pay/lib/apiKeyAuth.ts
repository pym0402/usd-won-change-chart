import { NextRequest, NextResponse } from 'next/server'
import { merchantService } from '@/services/merchantService'

/**
 * API 키 인증 미들웨어
 * 가맹점 API 키를 통해 인증을 수행합니다.
 */
export async function withApiKeyAuth(
  request: NextRequest,
  handler: (request: NextRequest, merchantId: string) => Promise<NextResponse>
) {
  try {
    // API 키 헤더 추출
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 키가 필요합니다.' },
        { status: 401 }
      )
    }

    // API 키로 가맹점 조회
    const merchant = await merchantService.getMerchantByApiKey(apiKey)

    if (!merchant) {
      return NextResponse.json(
        { error: '유효하지 않은 API 키입니다.' },
        { status: 401 }
      )
    }

    if (merchant.status !== 'APPROVED') {
      return NextResponse.json(
        { error: '승인되지 않은 가맹점입니다.' },
        { status: 403 }
      )
    }

    // 핸들러 실행
    return await handler(request, merchant.id)
  } catch (error) {
    console.error('API 키 인증 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'API 키 인증 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
