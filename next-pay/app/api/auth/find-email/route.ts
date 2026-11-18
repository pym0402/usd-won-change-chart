import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: '이름은 필수입니다.' },
        { status: 400 }
      )
    }

    // 사용자 찾기
    const user = await prisma.user.findFirst({
      where: { name }
    })

    if (!user) {
      return NextResponse.json(
        { error: '해당 이름으로 등록된 계정을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 보안을 위해 이메일 일부 마스킹
    const maskedEmail = maskEmail(user.email)

    return NextResponse.json(
      { 
        email: maskedEmail,
        message: '이메일을 찾았습니다.'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Find email error:', error)
    return NextResponse.json(
      { error: '이메일 찾기 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (localPart.length <= 2) {
    return email
  }
  const maskedLocal = localPart.slice(0, 2) + '*'.repeat(localPart.length - 2)
  return `${maskedLocal}@${domain}`
}
