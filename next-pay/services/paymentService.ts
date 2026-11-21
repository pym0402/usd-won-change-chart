import { prisma } from '@/lib/prisma'
import { PaymentStatus, AccountType, ReferenceType } from '@prisma/client'
import Stripe from 'stripe'
import crypto from 'crypto'
import { settlementService } from './settlementService'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-09-30.endive"
    })
  : null

function requireStripe() {
  if (!stripe) {
    throw new Error('Stripe 비밀 키가 설정되지 않았습니다.')
  }
  return stripe
}

export const paymentService = {
  /**
   * 멱등성 키 생성
   */
  generateIdempotencyKey(merchantId: string, customerId: string): string {
    return `payment_${merchantId}_${customerId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  },

  /**
   * Payment Intent 생성
   */
  async createPaymentIntent(
    merchantId: string,
    customerId: string,
    amount: number,
    paymentMethodId?: string,
    pointAmount: number = 0
  ) {
    const idempotencyKey = this.generateIdempotencyKey(merchantId, customerId)

    // 카드 결제 금액 계산
    const cardAmount = amount - pointAmount

    if (cardAmount < 0) {
      throw new Error('포인트 사용 금액이 총 결제 금액을 초과할 수 없습니다.')
    }

    // 포인트 잔액 검증
    if (pointAmount > 0) {
      const { walletService } = await import('./walletService')
      const wallet = await walletService.getWallet(customerId)
      if (wallet.balance < pointAmount) {
        throw new Error(`포인트 잔액이 부족합니다. 현재 잔액: ${wallet.balance}P, 요청 금액: ${pointAmount}P`)
      }
    }

    // Stripe Payment Intent 생성 (카드 결제가 있는 경우에만)
    let stripePaymentIntent = null
    let clientSecret = null

    if (cardAmount > 0) {
      if (!stripe) {
        throw new Error('카드 결제를 위해서는 Stripe API Key가 필요합니다. .env 파일에 STRIPE_SECRET_KEY를 설정해주세요.')
      }

      stripePaymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(cardAmount * 100), // 원 단위를 페이(cents)로 변환
          currency: 'krw',
          metadata: {
            merchantId,
            customerId,
            idempotencyKey
          }
        },
        {
          idempotencyKey
        }
      )

      clientSecret = stripePaymentIntent.client_secret
    }

    // Payment 레코드 생성
    const payment = await prisma.payment.create({
      data: {
        merchantId,
        customerId,
        amount,
        status: PaymentStatus.PENDING,
        paymentMethodId,
        pointAmount,
        cardAmount,
        idempotencyKey,
        stripePaymentId: stripePaymentIntent?.id
      }
    })

    // FDS 검사 수행
    const { fraudDetectionService } = await import('./fraudDetectionService')
    const fraudResult = await fraudDetectionService.analyzePayment(payment.id)

    // 차단된 경우 에러 반환
    if (fraudResult.action === 'BLOCK') {
      return {
        payment,
        clientSecret,
        idempotencyKey,
        blocked: true,
        fraudResult
      }
    }

    return {
      payment,
      clientSecret,
      idempotencyKey,
      blocked: false,
      fraudResult
    }
  },

  /**
   * 결제 승인
   */
  async confirmPayment(
    paymentId: string,
    paymentMethodId?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Payment 조회
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          merchant: true
        }
      })

      if (!payment) {
        throw new Error('결제 정보를 찾을 수 없습니다.')
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new Error('이미 처리된 결제입니다.')
      }

      // FDS 차단 확인
      if (payment.fraudDetected && payment.fraudScore && payment.fraudScore >= 70) {
        throw new Error('FDS에 의해 차단된 결제입니다.')
      }

      const stripeForConfirmation = payment.cardAmount > 0 && payment.stripePaymentId && paymentMethodId
        ? requireStripe()
        : null

      const pointsOnly = payment.cardAmount === 0
      if (pointsOnly) {
        const updated = await tx.payment.updateMany({
          where: { id: paymentId, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.COMPLETED }
        })
        if (!updated.count) throw new Error('이미 처리된 결제입니다.')
      }

      // 포인트 사용 처리
      if (payment.pointAmount > 0) {
        const { walletService } = await import('./walletService')
        await walletService.usePoints({
          userId: payment.customerId,
          amount: payment.pointAmount,
          description: '결제 포인트 사용',
          referenceId: paymentId
        }, pointsOnly ? tx : undefined)
      }

      // 카드 결제 처리
      if (payment.cardAmount > 0 && payment.stripePaymentId) {
        if (paymentMethodId && stripeForConfirmation) {
          // Payment Method로 결제 승인
          await stripeForConfirmation.paymentIntents.confirm(payment.stripePaymentId, {
            payment_method: paymentMethodId
          })
        }
        // Stripe 웹훅을 통해 상태 업데이트됨
      } else if (pointsOnly) {
        // 원장 기록 (카드 결제 없는 경우)
        await this.createLedgerEntriesForPayment(tx, paymentId, payment.amount, payment.cardAmount)

        // 포인트 적립 (1%) - 포인트만 사용한 경우에도 적립
        const earnAmount = payment.amount * 0.01
        if (earnAmount > 0) {
          const { walletService } = await import('./walletService')
          await walletService.earnPoints(
            payment.customerId,
            earnAmount,
            '결제 완료 포인트 적립',
            paymentId,
            tx
          )
        }
        await settlementService.createSettlement(paymentId, tx)
        return { ...payment, status: PaymentStatus.COMPLETED }
      }

      return payment
    })
  },

  /**
   * 결제 취소 (환불)
   */
  async cancelPayment(paymentId: string, reason?: string) {
    return await prisma.$transaction(async (tx) => {
      // Payment 조회
      const payment = await tx.payment.findUnique({
        where: { id: paymentId }
      })

      if (!payment) {
        throw new Error('결제 정보를 찾을 수 없습니다.')
      }

      if (payment.status === PaymentStatus.REFUNDED) {
        throw new Error('이미 환불된 결제입니다.')
      }

      // Stripe 환불 처리
      if (payment.stripePaymentId && payment.cardAmount > 0) {
        try {
          await requireStripe().refunds.create({
            payment_intent: payment.stripePaymentId,
            reason: 'requested_by_customer'
          })
        } catch (error) {
          console.error('Stripe 환불 오류:', error)
          throw new Error('Stripe 환불 처리 중 오류가 발생했습니다.')
        }
      }

      // 포인트 복구
      if (payment.pointAmount > 0) {
        const { walletService } = await import('./walletService')
        await walletService.chargePoints({
          userId: payment.customerId,
          amount: payment.pointAmount,
          description: '결제 취소로 인한 포인트 복구',
          referenceId: paymentId
        })
      }

      // 결제 상태 업데이트
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          metadata: payment.metadata ? {
            ...(payment.metadata as any),
            refundReason: reason
          } : {
            refundReason: reason
          }
        }
      })

      return updatedPayment
    })
  },

  /**
   * 결제 상세 조회
   */
  async getPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        merchant: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        customer: { select: { id: true, name: true, email: true } },
        paymentMethod: { select: { id: true, type: true, last4: true, bankName: true } },
        settlement: true
      }
    })

    if (!payment) {
      throw new Error('결제 정보를 찾을 수 없습니다.')
    }

    return payment
  },

  /**
   * 결제 내역 조회
   */
  async getPayments(
    ownerId: string,
    role: 'customer' | 'merchant',
    status?: PaymentStatus,
    limit: number = 50,
    offset: number = 0
  ) {
    const where = role === 'customer' ? { customerId: ownerId, status } : { merchantId: ownerId, status }


    const payments = await prisma.payment.findMany({
      where,
      include: {
        merchant: { select: { id: true, businessName: true } },
        customer: { select: { id: true, name: true, email: true } },
        paymentMethod: { select: { id: true, type: true, last4: true, bankName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.payment.count({ where })

    return {
      payments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
  },

  /**
   * 결제 원장 엔트리 생성
   */
  async createLedgerEntriesForPayment(
    tx: any,
    paymentId: string,
    amount: number,
    cardAmount: number
  ) {
    // 카드 결제 원장 기록
    if (cardAmount > 0) {
      // 차변: CASH
      await tx.ledgerEntry.create({
        data: {
          referenceId: paymentId,
          referenceType: ReferenceType.PAYMENT,
          accountType: AccountType.CASH,
          debit: cardAmount,
          credit: 0,
          description: `카드 결제 - ${cardAmount}원`
        }
      })

      // 대변: REVENUE
      await tx.ledgerEntry.create({
        data: {
          referenceId: paymentId,
          referenceType: ReferenceType.PAYMENT,
          accountType: AccountType.REVENUE,
          debit: 0,
          credit: cardAmount,
          description: `카드 결제 - ${cardAmount}원`
        }
      })
    }
  },

  /**
   * 웹훅 서명 검증
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET 환경 변수가 설정되지 않았습니다.')
    }

    return requireStripe().webhooks.constructEvent(payload, signature, webhookSecret)
  },

  /**
   * 웹훅 이벤트 처리
   */
  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      default:
        console.log(`처리되지 않은 이벤트 타입: ${event.type}`)
    }
  },

  /**
   * 결제 성공 처리
   */
  async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const { merchantId, customerId } = paymentIntent.metadata

    if (!merchantId || !customerId) {
      console.error('메타데이터에 merchantId 또는 customerId가 없습니다.')
      return
    }

    await prisma.$transaction(async (tx) => {
      // Payment 조회
      const payment = await tx.payment.findFirst({
        where: {
          stripePaymentId: paymentIntent.id
        }
      })

      if (!payment) {
        console.error('Payment 레코드를 찾을 수 없습니다.')
        return
      }

      // 결제 상태 업데이트
      const updated = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.FAILED] }
        },
        data: {
          status: PaymentStatus.COMPLETED
        }
      })

      if (!updated.count) {
        const current = await tx.payment.findUniqueOrThrow({
          where: { id: payment.id },
          select: { status: true }
        })
        if (current.status === PaymentStatus.COMPLETED) {
          await settlementService.createSettlement(payment.id, tx)
        }
        return
      }

      // 원장 기록
      await this.createLedgerEntriesForPayment(tx, payment.id, payment.amount, payment.cardAmount)

      // 포인트 적립 (1%)
      const earnAmount = payment.amount * 0.01
      if (earnAmount > 0) {
        const { walletService } = await import('./walletService')
        await walletService.earnPoints(
          customerId,
          earnAmount,
          '결제 완료 포인트 적립',
          payment.id,
          tx
        )
      }

      // 정산 생성
      await settlementService.createSettlement(payment.id, tx)
    })
  },

  /**
   * 결제 실패 처리
   */
  async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentId: paymentIntent.id
      }
    })

    if (!payment) {
      console.error('Payment 레코드를 찾을 수 없습니다.')
      return
    }

    // 포인트 복구
    if (payment.pointAmount > 0) {
      const { walletService } = await import('./walletService')
      await walletService.chargePoints({
        userId: payment.customerId,
        amount: payment.pointAmount,
        description: '결제 실패로 인한 포인트 복구',
        referenceId: payment.id
      })
    }

    // 결제 상태 업데이트
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED
      }
    })
  },

  /**
   * 환불 처리
   */
  async handleChargeRefunded(charge: Stripe.Charge) {
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentId: charge.payment_intent as string
      }
    })

    if (!payment) {
      console.error('Payment 레코드를 찾을 수 없습니다.')
      return
    }

    // 결제 상태 업데이트
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED
      }
    })
  }
}
