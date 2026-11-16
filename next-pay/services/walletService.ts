import { prisma } from '@/lib/prisma'
import { TransactionType, AccountType, ReferenceType } from '@prisma/client'

interface ChargePointsParams {
  userId: string
  amount: number
  description?: string
  referenceId?: string
}

interface UsePointsParams {
  userId: string
  amount: number
  description?: string
  referenceId?: string
}

export const walletService = {
  /**
   * 지갑 생성 (사용자 생성 시 자동 호출)
   */
  async createWallet(userId: string) {
    return await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        currency: 'KRW'
      }
    })
  },

  /**
   * 지갑 조회 (없으면 자동 생성)
   */
  async getWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          currency: 'KRW'
        },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })
    }

    return wallet
  },

  /**
   * 포인트 충전 (복식부기 원장 포함)
   * 트랜잭션: 차변(CASH) + 대변(POINTS)
   */
  async chargePoints(params: ChargePointsParams) {
    const { userId, amount, description, referenceId } = params

    if (amount <= 0) {
      throw new Error('충전 금액은 0보다 커야 합니다.')
    }

    return await prisma.$transaction(async (tx) => {
      // 1. 지갑 조회 또는 생성
      let wallet = await tx.wallet.findUnique({
        where: { userId }
      })

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId,
            balance: 0,
            currency: 'KRW'
          }
        })
      }

      // 2. 지갑 잔액 업데이트
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance + amount
        }
      })

      // 3. 포인트 거래 기록 생성
      const pointTransaction = await tx.pointTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.CHARGE,
          amount,
          balanceAfter: updatedWallet.balance,
          description: description || '포인트 충전',
          referenceId
        }
      })

      // 4. 복식부기 원장 기록
      // 차변: CASH (현금 계정)
      await tx.ledgerEntry.create({
        data: {
          referenceId: pointTransaction.id,
          referenceType: ReferenceType.POINT_TRANSACTION,
          accountType: AccountType.CASH,
          debit: amount,
          credit: 0,
          description: `포인트 충전 - ${amount}원`
        }
      })

      // 대변: POINTS (포인트 계정)
      await tx.ledgerEntry.create({
        data: {
          referenceId: pointTransaction.id,
          referenceType: ReferenceType.POINT_TRANSACTION,
          accountType: AccountType.POINTS,
          debit: 0,
          credit: amount,
          description: `포인트 충전 - ${amount}원`
        }
      })

      return {
        wallet: updatedWallet,
        transaction: pointTransaction
      }
    })
  },

  /**
   * 포인트 사용 (복식부기 원장 포함)
   * 트랜잭션: 차변(POINTS) + 대변(REVENUE)
   */
  async usePoints(params: UsePointsParams) {
    const { userId, amount, description, referenceId } = params

    if (amount <= 0) {
      throw new Error('사용 금액은 0보다 커야 합니다.')
    }

    return await prisma.$transaction(async (tx) => {
      // 1. 지갑 조회
      const wallet = await tx.wallet.findUnique({
        where: { userId }
      })

      if (!wallet) {
        throw new Error('지갑을 찾을 수 없습니다.')
      }

      // 2. 잔액 확인
      if (wallet.balance < amount) {
        throw new Error('포인트 잔액이 부족합니다.')
      }

      // 3. 지갑 잔액 업데이트
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance - amount
        }
      })

      // 4. 포인트 거래 기록 생성
      const pointTransaction = await tx.pointTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.USE,
          amount,
          balanceAfter: updatedWallet.balance,
          description: description || '포인트 사용',
          referenceId
        }
      })

      // 5. 복식부기 원장 기록
      // 차변: POINTS (포인트 계정)
      await tx.ledgerEntry.create({
        data: {
          referenceId: pointTransaction.id,
          referenceType: ReferenceType.POINT_TRANSACTION,
          accountType: AccountType.POINTS,
          debit: amount,
          credit: 0,
          description: `포인트 사용 - ${amount}원`
        }
      })

      // 대변: REVENUE (수익 계정)
      await tx.ledgerEntry.create({
        data: {
          referenceId: pointTransaction.id,
          referenceType: ReferenceType.POINT_TRANSACTION,
          accountType: AccountType.REVENUE,
          debit: 0,
          credit: amount,
          description: `포인트 사용 - ${amount}원`
        }
      })

      return {
        wallet: updatedWallet,
        transaction: pointTransaction
      }
    })
  },

  /**
   * 포인트 적립 (결제 완료 시)
   * 트랜잭션: 차변(REVENUE) + 대변(POINTS)
   */
  async earnPoints(userId: string, amount: number, description?: string, referenceId?: string) {
    if (amount <= 0) {
      throw new Error('적립 금액은 0보다 커야 합니다.')
    }

    return await prisma.$transaction(async (tx) => {
      // 1. 지갑 조회 또는 생성
      let wallet = await tx.wallet.findUnique({
        where: { userId }
      })

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId,
            balance: 0,
            currency: 'KRW'
          }
        })
      }

      // 2. 지갑 잔액 업데이트
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: wallet.balance + amount
        }
      })

      // 3. 포인트 거래 기록 생성
      const pointTransaction = await tx.pointTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.EARN,
          amount,
          balanceAfter: updatedWallet.balance,
          description: description || '포인트 적립',
          referenceId
        }
      })

      // 4. 복식부기 원장 기록
      // 차변: REVENUE (수익 계정)
      await tx.ledgerEntry.create({
        data: {
          referenceId: pointTransaction.id,
          referenceType: ReferenceType.POINT_TRANSACTION,
          accountType: AccountType.REVENUE,
          debit: amount,
          credit: 0,
          description: `포인트 적립 - ${amount}원`
        }
      })

      // 대변: POINTS (포인트 계정)
      await tx.ledgerEntry.create({
        data: {
          referenceId: pointTransaction.id,
          referenceType: ReferenceType.POINT_TRANSACTION,
          accountType: AccountType.POINTS,
          debit: 0,
          credit: amount,
          description: `포인트 적립 - ${amount}원`
        }
      })

      return {
        wallet: updatedWallet,
        transaction: pointTransaction
      }
    })
  },

  /**
   * 원장 무결성 검증
   */
  async validateLedgerIntegrity() {
    const entries = await prisma.ledgerEntry.findMany()
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0)
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`원장 무결성 위반: 차변(${totalDebit})과 대변(${totalCredit})의 합이 일치하지 않습니다.`)
    }

    return {
      isValid: true,
      totalDebit,
      totalCredit,
      totalEntries: entries.length
    }
  }
}
