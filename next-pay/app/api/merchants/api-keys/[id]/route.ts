import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { merchantService } from '@/services/merchantService'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authorize('MERCHANT', 'ADMIN')
    if (user instanceof NextResponse) return user
    const userId = user.id
    const { id: apiKeyId } = await params

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
      // 관리자가 특정 가맹점의 키를 삭제하는 경우
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

    await merchantService.deleteApiKey(apiKeyId, merchantId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API 키 삭제 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'API 키 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
