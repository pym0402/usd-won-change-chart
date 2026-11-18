import { prisma } from '@/lib/prisma'
import { FraudAction, PaymentStatus } from '@prisma/client'

interface RiskFactor {
  type: string
  score: number
  description: string
}

interface FraudDetectionResult {
  riskScore: number
  riskFactors: RiskFactor[]
  action: FraudAction
}

export const fraudDetectionService = {
  /**
   * 위험 점수 계산 (0-100)
   */
  async calculateRiskScore(paymentId: string): Promise<FraudDetectionResult> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        customer: true,
        merchant: true
      }
    })

    if (!payment) {
      throw new Error('결제 정보를 찾을 수 없습니다.')
    }

    const riskFactors: RiskFactor[] = []
    let totalRiskScore = 0

    // 1. 결제 금액 기반 위험 점수
    const amountRisk = this.calculateAmountRisk(payment.amount)
    if (amountRisk > 0) {
      riskFactors.push({
        type: 'HIGH_AMOUNT',
        score: amountRisk,
        description: `높은 결제 금액: ${payment.amount}원`
      })
      totalRiskScore += amountRisk
    }

    // 2. 단시간 다수 결제 패턴 탐지
    const frequencyRisk = await this.calculateFrequencyRisk(payment.customerId)
    if (frequencyRisk > 0) {
      riskFactors.push({
        type: 'HIGH_FREQUENCY',
        score: frequencyRisk,
        description: '단시간 내 다수 결제 시도'
      })
      totalRiskScore += frequencyRisk
    }

    // 3. 이상 IP 패턴 탐지 (메타데이터에서 IP 확인)
    const ipRisk = this.calculateIPRisk(payment.metadata as any)
    if (ipRisk > 0) {
      riskFactors.push({
        type: 'SUSPICIOUS_IP',
        score: ipRisk,
        description: '의심스러운 IP 주소'
      })
      totalRiskScore += ipRisk
    }

    // 4. 신규 사용자 여부 (가입 후 7일 이내)
    const newUserRisk = this.calculateNewUserRisk(payment.customer.createdAt)
    if (newUserRisk > 0) {
      riskFactors.push({
        type: 'NEW_USER',
        score: newUserRisk,
        description: '신규 사용자 계정'
      })
      totalRiskScore += newUserRisk
    }

    // 5. 가맹점 신뢰도 점수 (가맹점 승인 일자 기반)
    const merchantRisk = await this.calculateMerchantRisk(payment.merchant.approvedAt)
    if (merchantRisk > 0) {
      riskFactors.push({
        type: 'NEW_MERCHANT',
        score: merchantRisk,
        description: '신규 가맹점'
      })
      totalRiskScore += merchantRisk
    }

    // 6. 결제 금액 패턴 (같은 금액 반복)
    const patternRisk = await this.calculatePatternRisk(payment.customerId, payment.amount)
    if (patternRisk > 0) {
      riskFactors.push({
        type: 'REPEATED_AMOUNT',
        score: patternRisk,
        description: '동일 금액 반복 결제'
      })
      totalRiskScore += patternRisk
    }

    // 최대 점수는 100으로 제한
    totalRiskScore = Math.min(totalRiskScore, 100)

    // 조치 결정
    let action: FraudAction
    if (totalRiskScore >= 70) {
      action = FraudAction.BLOCK
    } else if (totalRiskScore >= 40) {
      action = FraudAction.REVIEW
    } else {
      action = FraudAction.ALLOW
    }

    return {
      riskScore: totalRiskScore,
      riskFactors,
      action
    }
  },

  /**
   * 결제 금액 기반 위험 점수 계산
   */
  calculateAmountRisk(amount: number): number {
    if (amount > 1000000) return 30 // 100만원 초과
    if (amount > 500000) return 20  // 50만원 초과
    if (amount > 100000) return 10  // 10만원 초과
    return 0
  },

  /**
   * 단시간 다수 결제 패턴 탐지
   */
  async calculateFrequencyRisk(customerId: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const recentPayments = await prisma.payment.count({
      where: {
        customerId,
        createdAt: { gte: oneHourAgo },
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.COMPLETED] }
      }
    })

    if (recentPayments >= 10) return 25
    if (recentPayments >= 5) return 15
    if (recentPayments >= 3) return 5
    return 0
  },

  /**
   * IP 기반 위험 점수 계산
   */
  calculateIPRisk(metadata: any): number {
    if (!metadata || !metadata.ip) return 0

    const ip = metadata.ip as string

    // VPN/Proxy 탐지 (간단한 패턴)
    const suspiciousPatterns = [
      /.*\.vpn$/,
      /.*\.proxy$/,
      /^192\.168\./, // 내부 IP (일반적인 사용자 패턴)
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(ip)) {
        return 15
      }
    }

    return 0
  },

  /**
   * 신규 사용자 위험 점수 계산
   */
  calculateNewUserRisk(createdAt: Date): number {
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceCreation <= 1) return 20  // 1일 이내
    if (daysSinceCreation <= 7) return 10  // 7일 이내
    return 0
  },

  /**
   * 가맹점 신뢰도 점수 계산
   */
  async calculateMerchantRisk(approvedAt: Date | null): Promise<number> {
    if (!approvedAt) return 30 // 승인되지 않은 가맹점

    const daysSinceApproval = (Date.now() - approvedAt.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceApproval <= 7) return 15  // 7일 이내 승인
    if (daysSinceApproval <= 30) return 5  // 30일 이내 승인
    return 0
  },

  /**
   * 결제 금액 패턴 탐지 (동일 금액 반복)
   */
  async calculatePatternRisk(customerId: string, amount: number): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const sameAmountPayments = await prisma.payment.count({
      where: {
        customerId,
        amount,
        createdAt: { gte: oneDayAgo },
        status: { in: [PaymentStatus.COMPLETED] }
      }
    })

    if (sameAmountPayments >= 5) return 20
    if (sameAmountPayments >= 3) return 10
    return 0
  },

  /**
   * 결제 전 FDS 검사 및 조치 적용
   */
  async analyzePayment(paymentId: string): Promise<FraudDetectionResult> {
    const result = await this.calculateRiskScore(paymentId)

    // FraudDetection 레코드 생성
    await prisma.fraudDetection.create({
      data: {
        paymentId,
        riskScore: result.riskScore,
        riskFactors: result.riskFactors as any,
        action: result.action
      }
    })

    // 차단된 경우 결제 상태 업데이트
    if (result.action === FraudAction.BLOCK) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          fraudScore: result.riskScore,
          fraudDetected: true
        }
      })
    } else {
      // 위험 점수 업데이트
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          fraudScore: result.riskScore,
          fraudDetected: result.riskScore > 50
        }
      })
    }

    return result
  },

  /**
   * 검토 대상 결제 목록 조회
   */
  async getReviewPendingPayments() {
    return await prisma.fraudDetection.findMany({
      where: {
        action: FraudAction.REVIEW,
        reviewedBy: null
      },
      include: {
        payment: {
          include: {
            customer: true,
            merchant: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  /**
   * 차단된 결제 목록 조회
   */
  async getBlockedPayments() {
    return await prisma.fraudDetection.findMany({
      where: {
        action: FraudAction.BLOCK
      },
      include: {
        payment: {
          include: {
            customer: true,
            merchant: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  /**
   * 모든 FDS 레코드 조회
   */
  async getAllFraudDetections(minRiskScore?: number) {
    const where: any = {}

    if (minRiskScore !== undefined) {
      where.riskScore = { gte: minRiskScore }
    }

    return await prisma.fraudDetection.findMany({
      where,
      include: {
        payment: {
          include: {
            customer: true,
            merchant: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  /**
   * 이상 결제 수동 조치 (관리자)
   */
  async takeAction(fraudDetectionId: string, action: FraudAction, reviewerId: string) {
    const fraudDetection = await prisma.fraudDetection.findUnique({
      where: { id: fraudDetectionId },
      include: { payment: true }
    })

    if (!fraudDetection) {
      throw new Error('FDS 레코드를 찾을 수 없습니다.')
    }

    // 이미 검토된 경우
    if (fraudDetection.reviewedBy) {
      throw new Error('이미 검토된 결제입니다.')
    }

    await prisma.$transaction(async (tx) => {
      // FDS 레코드 업데이트
      await tx.fraudDetection.update({
        where: { id: fraudDetectionId },
        data: {
          action,
          reviewedBy: reviewerId,
          reviewedAt: new Date()
        }
      })

      // 결제 상태 업데이트
      if (action === FraudAction.BLOCK) {
        await tx.payment.update({
          where: { id: fraudDetection.paymentId },
          data: { status: PaymentStatus.FAILED }
        })
      } else if (action === FraudAction.ALLOW) {
        // 차단된 결제를 허용으로 변경 시 결제 재처리 필요
        if (fraudDetection.payment.status === PaymentStatus.FAILED) {
          await tx.payment.update({
            where: { id: fraudDetection.paymentId },
            data: { status: PaymentStatus.PENDING }
          })
        }
      }
    })

    return fraudDetection
  },

  /**
   * FDS 통계
   */
  async getStats() {
    const [total, blocked, review, allowed] = await Promise.all([
      prisma.fraudDetection.count(),
      prisma.fraudDetection.count({ where: { action: FraudAction.BLOCK } }),
      prisma.fraudDetection.count({ where: { action: FraudAction.REVIEW } }),
      prisma.fraudDetection.count({ where: { action: FraudAction.ALLOW } })
    ])

    const avgRiskScore = await prisma.fraudDetection.aggregate({
      _avg: {
        riskScore: true
      }
    })

    return {
      total,
      blocked,
      review,
      allowed,
      avgRiskScore: avgRiskScore._avg.riskScore || 0
    }
  }
}
