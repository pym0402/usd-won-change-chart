import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: '이메일은 필수입니다.' },
        { status: 400 }
      )
    }

    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: '해당 이메일로 등록된 계정을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 임시 비밀번호 생성
    const tempPassword = crypto.randomBytes(4).toString('hex')
    const hashedPassword = await (await import('bcryptjs')).default.hash(tempPassword, 12)

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json(
      {
        message: '임시 비밀번호가 발급되었습니다.',
        tempPassword: tempPassword
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: '비밀번호 재설정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
