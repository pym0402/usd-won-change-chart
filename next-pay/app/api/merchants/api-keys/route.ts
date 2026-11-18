import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { merchantService } from '@/services/merchantService'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    // 가맹점 또는 관리자만 접근 가능
    if (userRole !== 'MERCHANT' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: '가맹점 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, permissions, expiresAt } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name은 필수입니다.' },
        { status: 400 }
      )
    }

    // 가맹점 ID 조회
    let merchantId

    if (userRole === 'MERCHANT') {
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
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    // 가맹점 또는 관리자만 접근 가능
    if (userRole !== 'MERCHANT' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: '가맹점 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    let merchantId

    if (userRole === 'MERCHANT') {
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
      merchantId = searchParams.get('merchantId')

      if (!merchantId) {
        return NextResponse.json(
          { error: 'merchantId 쿼리 파라미터가 필요합니다.' },
          { status: 400 }
        )
      }
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
