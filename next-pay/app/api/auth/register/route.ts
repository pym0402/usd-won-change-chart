import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name }: { email?: unknown; password?: unknown; name?: unknown } = body

    if (typeof email !== 'string' || !email || typeof password !== 'string' || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호는 필수입니다.' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+$/.test(email) || (name != null && typeof name !== 'string')) {
      return NextResponse.json({ error: '이메일 또는 이름 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12)

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      }
    })

    // 기본 CUSTOMER 역할 할당
    const customerRole = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' }
    })

    if (customerRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: customerRole.id
        }
      })
    }

    // 지갑 생성
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        currency: 'KRW'
      }
    })

    return NextResponse.json(
      { 
        message: '회원가입이 완료되었습니다.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
