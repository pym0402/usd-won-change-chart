import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { merchantService } from '@/services/merchantService'

export async function POST(request: Request) {
  try {
    const user = await authorize('MERCHANT')
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const { businessName, businessLicense, description, documents } = body

    if (!businessName) {
      return NextResponse.json(
        { error: 'businessName은 필수입니다.' },
        { status: 400 }
      )
    }

    const result = await merchantService.applyForMerchant(
      user.id,
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
