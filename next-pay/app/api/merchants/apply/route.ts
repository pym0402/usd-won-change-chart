import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { merchantService } from '@/services/merchantService'

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
    const body = await request.json()
    const { businessName, businessLicense, description, documents } = body

    if (!businessName) {
      return NextResponse.json(
        { error: 'businessName은 필수입니다.' },
        { status: 400 }
      )
    }

    const result = await merchantService.applyForMerchant(
      userId,
      businessName,
      businessLicense,
      description,
      documents
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('가맹점 입점 신청 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '가맹점 입점 신청 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
