import { NextResponse } from 'next/server'
import { paymentService } from '@/services/paymentService'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Stripe signature missing' },
        { status: 400 }
      )
    }

    // 웹훅 서명 검증
    const event = paymentService.verifyWebhookSignature(body, signature)

    // 웹훅 이벤트 처리
    await paymentService.handleWebhookEvent(event)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook 처리 실패' },
      { status: 500 }
    )
  }
}
