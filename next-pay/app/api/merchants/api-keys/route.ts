import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { merchantService } from '@/services/merchantService'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const user = await authorize('MERCHANT', 'ADMIN')
    if (user instanceof NextResponse) return user
    const userId = user.id

    const body = await request.json()
    const { name, permissions, expiresAt } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name은 필수입니다.' },
        { status: 400 }
      )
    }

    // 가맹점 ID 조회
    let merchantId: string

    if (user.roles.includes('MERCHANT') && !user.roles.includes('ADMIN')) {
      const merchant = await prisma.merchant.findUnique({
        where: { userId }
      })

      if (!merchant) {
        return NextResponse.json(
          { error: '가맹점 정보를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      merchantId = merchant.id
    } else {
      // 관리자가 특정 가맹점의 키를 생성하는 경우
      merchantId = body.merchantId
      if (!merchantId) {
        return NextResponse.json(
          { error: 'merchantId는 필수입니다.' },
          { status: 400 }
        )
      }
    }

    const apiKey = await merchantService.createApiKey(
      merchantId,
      name,
      permissions,
      expiresAt ? new Date(expiresAt) : undefined
    )

    return NextResponse.json(apiKey, { status: 201 })
  } catch (error) {
    console.error('API 키 발급 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'API 키 발급 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const user = await authorize('MERCHANT', 'ADMIN')
    if (user instanceof NextResponse) return user
    const userId = user.id

    let merchantId: string

    if (user.roles.includes('MERCHANT') && !user.roles.includes('ADMIN')) {
      const merchant = await prisma.merchant.findUnique({
        where: { userId }
      })

      if (!merchant) {
        return NextResponse.json(
          { error: '가맹점 정보를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      merchantId = merchant.id
    } else {
      // 관리자가 특정 가맹점의 키를 조회하는 경우
      const { searchParams } = new URL(request.url)
      const requestedMerchantId = searchParams.get('merchantId')

      if (!requestedMerchantId) {
        return NextResponse.json(
          { error: 'merchantId 쿼리 파라미터가 필요합니다.' },
          { status: 400 }
        )
      }
      merchantId = requestedMerchantId
    }

    const apiKeys = await merchantService.getApiKeys(merchantId)

    return NextResponse.json(apiKeys)
  } catch (error) {
    console.error('API 키 목록 조회 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'API 키 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
