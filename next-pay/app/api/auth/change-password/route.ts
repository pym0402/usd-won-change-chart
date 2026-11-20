import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth()
  const id = session?.user?.id
  if (!id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const { currentPassword, newPassword } = body ?? {}
  if (typeof currentPassword !== 'string' || !currentPassword ||
      typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword) > 72) {
    return NextResponse.json({ error: '현재 비밀번호와 8자 이상, UTF-8 기준 72바이트 이하의 새 비밀번호를 입력해 주세요.' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { password: true, passwordVersion: true, temporaryPasswordHash: true, temporaryPasswordExpiresAt: true },
    })
    const temporary = session.user.mustChangePassword
    if (!user || (!temporary && !user.password)) {
      return NextResponse.json({ error: '변경할 수 있는 비밀번호가 없습니다.' }, { status: 400 })
    }

    const currentHash = temporary ? user.temporaryPasswordHash : user.password
    if (!currentHash || (temporary && (!user.temporaryPasswordExpiresAt || user.temporaryPasswordExpiresAt <= new Date())) ||
        !(await bcrypt.compare(currentPassword, currentHash))) {
      return NextResponse.json({ error: '현재 비밀번호가 올바르지 않거나 만료되었습니다.' }, { status: 400 })
    }

    if (newPassword === currentPassword || (temporary && user.password && await bcrypt.compare(newPassword, user.password))) {
      return NextResponse.json({ error: '이전 비밀번호와 다른 새 비밀번호를 입력해 주세요.' }, { status: 400 })
    }

    const password = await bcrypt.hash(newPassword, 12)
    const updated = await prisma.user.updateMany({
      where: {
        id,
        passwordVersion: user.passwordVersion,
        ...(temporary && { temporaryPasswordHash: currentHash, temporaryPasswordExpiresAt: { gt: new Date() } }),
      },
      data: {
        password,
        passwordVersion: { increment: 1 },
        temporaryPasswordHash: null,
        temporaryPasswordExpiresAt: null,
      },
    })

    if (!updated.count) return NextResponse.json({ error: '세션이 변경되었습니다. 다시 로그인해 주세요.' }, { status: 409 })
    return NextResponse.json({ message: '비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.' })
  } catch {
    return NextResponse.json({ error: '비밀번호 변경 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
