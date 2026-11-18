import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import QRCode from 'qrcode'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const merchant = await prisma.merchant.findFirst({
      where: {
        userId: session.user.id
      }
    })

    if (!merchant) {
      return NextResponse.json({ error: '가맹점 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const amount = searchParams.get('amount')

    const qrData = JSON.stringify({
      merchantId: merchant.id,
      businessName: merchant.businessName,
      amount: amount ? parseInt(amount) : null,
      timestamp: Date.now()
    })

    const qrCode = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    return NextResponse.json({ qrCode })
  } catch (error) {
    console.error('QR 코드 생성 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'QR 코드 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
