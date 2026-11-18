import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { recipientEmail, amount, message } = await request.json()

    if (!recipientEmail || !amount || amount <= 0) {
      return NextResponse.json(
        { error: '수신자 이메일과 금액을 입력해주세요.' },
        { status: 400 }
      )
    }

    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { wallet: true }
    })

    if (!sender?.wallet) {
      return NextResponse.json({ error: '지갑을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (sender.wallet.balance < amount) {
      return NextResponse.json({ error: '잔액이 부족합니다.' }, { status: 400 })
    }

    const recipient = await prisma.user.findUnique({
      where: { email: recipientEmail },
      include: { wallet: true }
    })

    if (!recipient) {
      return NextResponse.json({ error: '수신자를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!recipient.wallet) {
      return NextResponse.json({ error: '수신자의 지갑을 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: sender.wallet.id },
        data: { balance: { decrement: amount } }
      }),
      prisma.wallet.update({
        where: { id: recipient.wallet.id },
        data: { balance: { increment: amount } }
      }),
      prisma.pointTransaction.create({
        data: {
          walletId: sender.wallet.id,
          type: 'TRANSFER_OUT',
          amount,
          balanceAfter: sender.wallet.balance - amount,
          description: message || `${recipient.name || recipient.email}님에게 송금`
        }
      }),
      prisma.pointTransaction.create({
        data: {
          walletId: recipient.wallet.id,
          type: 'TRANSFER_IN',
          amount,
          balanceAfter: recipient.wallet.balance + amount,
          description: message || `${sender.name || sender.email}님으로부터 송금`
        }
      })
    ])

    return NextResponse.json({
      message: '송금이 완료되었습니다.',
      recipientName: recipient.name || recipient.email
    })
  } catch (error) {
    console.error('송금 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '송금 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
