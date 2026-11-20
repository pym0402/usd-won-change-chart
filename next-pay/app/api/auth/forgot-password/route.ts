import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const validityMs = 15 * 60_000
const resendDelayMs = 60_000
const message = '등록된 계정이 있다면 이메일로 임시 비밀번호를 보내드립니다.'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  if (!email || email.length > 254) {
    return NextResponse.json({ error: '이메일 주소를 입력해 주세요.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.PASSWORD_RECOVERY_FROM
  if (!apiKey || !from) {
    return NextResponse.json({ error: '현재 비밀번호 복구 메일을 발송할 수 없습니다.' }, { status: 503 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, passwordVersion: true }
    })
    if (user?.password) {
      const now = Date.now()
      const tempPassword = randomBytes(18).toString('base64url')
      const hash = await bcrypt.hash(tempPassword, 12)
      const reserved = await prisma.user.updateMany({
        where: {
          id: user.id,
          passwordVersion: user.passwordVersion,
          OR: [
            { temporaryPasswordExpiresAt: null },
            { temporaryPasswordExpiresAt: { lte: new Date(now + validityMs - resendDelayMs) } },
          ],
        },
        data: { temporaryPasswordHash: hash, temporaryPasswordExpiresAt: new Date(now + validityMs) },
      })

      if (reserved.count) {
        try {
          const delivery = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from,
              to: [user.email],
              subject: 'Next Pay 임시 비밀번호',
              text: `임시 비밀번호: ${tempPassword}\n15분 이내에 로그인한 뒤 새 비밀번호로 변경해 주세요.`,
            }),
            redirect: 'error',
            signal: AbortSignal.timeout(8000),
          })
          if (!delivery.ok) throw new Error('Email delivery failed')
        } catch {
          await prisma.user.updateMany({
            where: { id: user.id, temporaryPasswordHash: hash },
            data: { temporaryPasswordHash: null, temporaryPasswordExpiresAt: null },
          })
          console.error('비밀번호 복구 메일을 발송하지 못했습니다.')
        }
      }
    }

    return NextResponse.json({ message }, { status: 202 })
  } catch {
    return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
