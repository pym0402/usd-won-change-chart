import { prisma } from '@/lib/prisma'
import { PaymentMethodType, PaymentMethodStatus } from '@prisma/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-09-30.endive"
})

export const paymentMethodService = {
  /**
   * Stripe 고객(Customer) 생성 또는 조회
   */
  async getOrCreateStripeCustomer(userId: string, email: string, name?: string) {
    // 기존 PaymentMethod의 provider 필드에서 Stripe Customer ID 확인
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: {
        userId,
        provider: { not: null }
      }
    })

    if (existingMethod && existingMethod.provider) {
      return existingMethod.provider
    }

    // 새로운 Stripe Customer 생성
    const customer = await stripe.customers.create({
      email,
      name: name || email.split('@')[0],
      metadata: {
        userId
      }
    })

    return customer.id
  },

  /**
   * 결제 수단 등록 (카드)
   */
  async createCardPaymentMethod(
    userId: string,
    paymentMethodId: string,
    isDefault: boolean = false
  ) {
    return await prisma.$transaction(async (tx) => {
      // Stripe Payment Method 조회
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

      if (paymentMethod.type !== 'card') {
        throw new Error('카드 결제 수단만 등록 가능합니다.')
      }

      const card = paymentMethod.card
      if (!card) {
        throw new Error('카드 정보를 찾을 수 없습니다.')
      }

      // Stripe Customer ID 가져오기 또는 생성
      const stripeCustomerId = await this.getOrCreateStripeCustomer(
        userId,
        (await tx.user.findUnique({ where: { id: userId } }))?.email || ''
      )

      // Payment Method를 Customer에 연결
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      })

      // 기본 결제 수단으로 설정하는 경우
      if (isDefault) {
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        })

        // 다른 카드들의 isDefault 해제
        await tx.paymentMethod.updateMany({
          where: {
            userId,
            type: PaymentMethodType.CARD,
            isDefault: true
          },
          data: {
            isDefault: false
          }
        })
      }

      // PaymentMethod 저장
      const savedMethod = await tx.paymentMethod.create({
        data: {
          userId,
          type: PaymentMethodType.CARD,
          isDefault,
          provider: stripeCustomerId,
          providerMethodId: paymentMethodId,
          last4: card.last4,
          expiryMonth: card.exp_month,
          expiryYear: card.exp_year,
          status: PaymentMethodStatus.ACTIVE
        }
      })

      return savedMethod
    })
  },

  /**
   * 결제 수단 등록 (계좌)
   */
  async createBankAccountPaymentMethod(
    userId: string,
    bankName: string,
    bankAccount: string,
    isDefault: boolean = false
  ) {
    return await prisma.$transaction(async (tx) => {
      // 기본 결제 수단으로 설정하는 경우
      if (isDefault) {
        await tx.paymentMethod.updateMany({
          where: {
            userId,
            type: PaymentMethodType.BANK_ACCOUNT,
            isDefault: true
          },
          data: {
            isDefault: false
          }
        })
      }

      // PaymentMethod 저장
      const savedMethod = await tx.paymentMethod.create({
        data: {
          userId,
          type: PaymentMethodType.BANK_ACCOUNT,
          isDefault,
          bankName,
          bankAccount,
          status: PaymentMethodStatus.ACTIVE
        }
      })

      return savedMethod
    })
  },

  /**
   * 결제 수단 목록 조회
   */
  async getPaymentMethods(userId: string) {
    return await prisma.paymentMethod.findMany({
      where: {
        userId,
        status: PaymentMethodStatus.ACTIVE
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  },

  /**
   * 기본 결제 수단 설정
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
    return await prisma.$transaction(async (tx) => {
      // 결제 수단 소유 확인
      const method = await tx.paymentMethod.findFirst({
        where: {
          id: paymentMethodId,
          userId
        }
      })

      if (!method) {
        throw new Error('결제 수단을 찾을 수 없습니다.')
      }

      // Stripe 카드인 경우 Stripe Customer 업데이트
      if (method.type === PaymentMethodType.CARD && method.provider && method.providerMethodId) {
        await stripe.customers.update(method.provider, {
          invoice_settings: {
            default_payment_method: method.providerMethodId
          }
        })
      }

      // 같은 타입의 다른 결제 수단들의 isDefault 해제
      await tx.paymentMethod.updateMany({
        where: {
          userId,
          type: method.type,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })

      // 해당 결제 수단을 기본으로 설정
      const updatedMethod = await tx.paymentMethod.update({
        where: { id: paymentMethodId },
        data: {
          isDefault: true
        }
      })

      return updatedMethod
    })
  },

  /**
   * 결제 수단 삭제 (비활성화)
   */
  async deletePaymentMethod(userId: string, paymentMethodId: string) {
    return await prisma.$transaction(async (tx) => {
      // 결제 수단 소유 확인
      const method = await tx.paymentMethod.findFirst({
        where: {
          id: paymentMethodId,
          userId
        }
      })

      if (!method) {
        throw new Error('결제 수단을 찾을 수 없습니다.')
      }

      // Stripe 카드인 경우 Stripe에서 분리
      if (method.type === PaymentMethodType.CARD && method.provider && method.providerMethodId) {
        try {
          await stripe.paymentMethods.detach(method.providerMethodId)
        } catch (error) {
          console.error('Stripe Payment Method 분리 오류:', error)
          // 오류가 발생해도 DB 업데이트는 진행
        }
      }

      // 결제 수단 비활성화
      const updatedMethod = await tx.paymentMethod.update({
        where: { id: paymentMethodId },
        data: {
          status: PaymentMethodStatus.INACTIVE
        }
      })

      return updatedMethod
    })
  }
}
