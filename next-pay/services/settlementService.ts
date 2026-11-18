import { prisma } from '@/lib/prisma'
import { SettlementStatus, AccountType, ReferenceType } from '@prisma/client'

export const settlementService = {
  /**
   * 수수료 계산
   */
  calculateCommission(amount: number, commissionRate: number = 0.025): number {
    return amount * commissionRate
  },

  /**
   * 순수익(Net Amount) 계산
   */
  calculateNetAmount(amount: number, commission: number): number {
    return amount - commission
  },

  /**
   * 정산 생성 (결제 완료 시 자동 호출)
   */
  async createSettlement(paymentId: string) {
    return await prisma.$transaction(async (tx) => {
      // Payment 조회
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          merchant: true
        }
      })

      if (!payment) {
        throw new Error('결제 정보를 찾을 수 없습니다.')
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('완료된 결제만 정산할 수 있습니다.')
      }

      // 기존 정산 확인
      const existingSettlement = await tx.merchantSettlement.findUnique({
        where: { paymentId }
      })

      if (existingSettlement) {
        return existingSettlement
      }

      // 수수료 계산
      const commission = this.calculateCommission(payment.amount, payment.merchant.commissionRate)
      const netAmount = this.calculateNetAmount(payment.amount, commission)

      // 정산 생성
      const settlement = await tx.merchantSettlement.create({
        data: {
          merchantId: payment.merchantId,
          paymentId,
          grossAmount: payment.amount,
          commission,
          netAmount,
          status: SettlementStatus.PENDING
        }
      })

      // 복식부기 원장 기록
      // 차변: REVENUE (전체 금액만큼 수익 계정 감소)
      await tx.ledgerEntry.create({
        data: {
          referenceId: settlement.id,
          referenceType: ReferenceType.SETTLEMENT,
          accountType: AccountType.REVENUE,
          debit: payment.amount,
          credit: 0,
          description: `정산 - ${payment.amount}원`
        }
      })

      // 대변: COMMISSION (플랫폼 수수료)
      await tx.ledgerEntry.create({
        data: {
          referenceId: settlement.id,
          referenceType: ReferenceType.SETTLEMENT,
          accountType: AccountType.COMMISSION,
          debit: 0,
          credit: commission,
          description: `수수료 - ${commission}원`
        }
      })

      // 대변: MERCHANT (가맹점 정산 금액)
      await tx.ledgerEntry.create({
        data: {
          referenceId: settlement.id,
          referenceType: ReferenceType.SETTLEMENT,
          accountType: AccountType.MERCHANT,
          debit: 0,
          credit: netAmount,
          description: `가맹점 정산 - ${netAmount}원`
        }
      })

      return settlement
    })
  },

  /**
   * 정산 내역 조회 (가맹점)
   */
  async getSettlements(merchantId: string, status?: SettlementStatus) {
    const where: any = { merchantId }

    if (status) {
      where.status = status
    }

    return await prisma.merchantSettlement.findMany({
      where,
      include: {
        payment: {
          include: {
            customer: true
          }
        },
        merchant: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  /**
   * 정산 상세 조회
   */
  async getSettlement(settlementId: string) {
    const settlement = await prisma.merchantSettlement.findUnique({
      where: { id: settlementId },
      include: {
        payment: {
          include: {
            customer: true
          }
        },
        merchant: {
          include: {
            user: true
          }
        }
      }
    })

    if (!settlement) {
      throw new Error('정산 정보를 찾을 수 없습니다.')
    }

    return settlement
  },

  /**
   * 정산 승인 (관리자)
   */
  async approveSettlement(settlementId: string, transactionId?: string) {
    return await prisma.$transaction(async (tx) => {
      const settlement = await tx.merchantSettlement.findUnique({
        where: { id: settlementId },
        include: {
          merchant: true
        }
      })

      if (!settlement) {
        throw new Error('정산 정보를 찾을 수 없습니다.')
      }

      if (settlement.status !== SettlementStatus.PENDING) {
        throw new Error('이미 처리된 정산입니다.')
      }

      // 정산 승인
      const updatedSettlement = await tx.merchantSettlement.update({
        where: { id: settlementId },
        data: {
          status: SettlementStatus.COMPLETED,
          settledAt: new Date(),
          transactionId
        }
      })

      return updatedSettlement
    })
  },

  /**
   * 정산 대기 목록 조회 (관리자)
   */
  async getPendingSettlements() {
    return await prisma.merchantSettlement.findMany({
      where: {
        status: SettlementStatus.PENDING
      },
      include: {
        payment: {
          include: {
            customer: true
          }
        },
        merchant: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  /**
   * 입금 계좌 업데이트
   */
  async updateBankAccount(merchantId: string, bankName: string, bankAccount: string) {
    return await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        bankName,
        bankAccount
      }
    })
  },

  /**
   * GMV (Gross Merchandise Volume) 집계
   */
  async getGMV(startDate?: Date, endDate?: Date) {
    const where: any = {
      status: 'COMPLETED'
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        where.createdAt.lte = endDate
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      select: {
        amount: true,
        createdAt: true
      }
    })

    const totalGMV = payments.reduce((sum, p) => sum + p.amount, 0)

    return {
      totalGMV,
      transactionCount: payments.length,
      payments
    }
  },

  /**
   * 수수료 수익 집계
   */
  async getCommissionRevenue(startDate?: Date, endDate?: Date) {
    const where: any = {}

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        where.createdAt.lte = endDate
      }
    }

    const settlements = await prisma.merchantSettlement.findMany({
      where,
      select: {
        commission: true,
        createdAt: true,
        merchant: {
          select: {
            commissionRate: true
          }
        }
      }
    })

    const totalCommission = settlements.reduce((sum, s) => sum + s.commission, 0)

    return {
      totalCommission,
      settlementCount: settlements.length,
      settlements
    }
  },

  /**
   * 플랫폼 대시보드 통계
   */
  async getDashboardStats(startDate?: Date, endDate?: Date) {
    const [gmvData, commissionData, activeMerchants, pendingSettlements] = await Promise.all([
      this.getGMV(startDate, endDate),
      this.getCommissionRevenue(startDate, endDate),
      prisma.merchant.count({
        where: { status: 'APPROVED' }
      }),
      prisma.merchantSettlement.count({
        where: { status: 'PENDING' }
      })
    ])

    return {
      gmv: gmvData.totalGMV,
      transactionCount: gmvData.transactionCount,
      commissionRevenue: commissionData.totalCommission,
      settlementCount: commissionData.settlementCount,
      activeMerchants,
      pendingSettlements
    }
  }
}
