import { prisma } from '@/lib/prisma'
import { MerchantStatus, ApplicationStatus } from '@prisma/client'
import crypto from 'crypto'

export const merchantService = {
  /**
   * API 키 생성
   */
  generateApiKey(): string {
    return `np_${crypto.randomBytes(32).toString('hex')}`
  },

  /**
   * 가맹점 입점 신청
   */
  async applyForMerchant(
    userId: string,
    businessName: string,
    businessLicense?: string,
    description?: string,
    documents?: any
  ) {
    return await prisma.$transaction(async (tx) => {
      // 기존 가맹점 확인
      const existingMerchant = await tx.merchant.findUnique({
        where: { userId }
      })

      if (existingMerchant) {
        throw new Error('이미 가맹점으로 등록된 사용자입니다.')
      }

      // 가맹점 생성
      const merchant = await tx.merchant.create({
        data: {
          userId,
          businessName,
          businessLicense,
          description,
          status: MerchantStatus.PENDING
        }
      })

      // 입점 신청서 생성
      const application = await tx.merchantApplication.create({
        data: {
          merchantId: merchant.id,
          documents,
          status: ApplicationStatus.PENDING
        }
      })

      return {
        merchant,
        application
      }
    })
  },

  /**
   * 가맹점 신청 목록 조회 (관리자)
   */
  async getApplications(status?: ApplicationStatus) {
    const where: any = {}

    if (status) {
      where.status = status
    }

    return await prisma.merchantApplication.findMany({
      where,
      include: {
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
   * 가맹점 승인 (관리자)
   */
  async approveApplication(applicationId: string, adminId: string) {
    return await prisma.$transaction(async (tx) => {
      // 신청서 조회
      const application = await tx.merchantApplication.findUnique({
        where: { id: applicationId },
        include: {
          merchant: true
        }
      })

      if (!application) {
        throw new Error('입점 신청을 찾을 수 없습니다.')
      }

      if (application.status !== ApplicationStatus.PENDING) {
        throw new Error('이미 처리된 신청입니다.')
      }

      // 신청서 승인
      await tx.merchantApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.APPROVED,
          reviewedBy: adminId,
          reviewedAt: new Date()
        }
      })

      // 가맹점 승인
      const updatedMerchant = await tx.merchant.update({
        where: { id: application.merchantId },
        data: {
          status: MerchantStatus.APPROVED,
          approvedAt: new Date()
        }
      })

      return updatedMerchant
    })
  },

  /**
   * 가맹점 거부 (관리자)
   */
  async rejectApplication(applicationId: string, adminId: string, reason: string) {
    return await prisma.$transaction(async (tx) => {
      // 신청서 조회
      const application = await tx.merchantApplication.findUnique({
        where: { id: applicationId },
        include: {
          merchant: true
        }
      })

      if (!application) {
        throw new Error('입점 신청을 찾을 수 없습니다.')
      }

      if (application.status !== ApplicationStatus.PENDING) {
        throw new Error('이미 처리된 신청입니다.')
      }

      // 신청서 거부
      await tx.merchantApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.REJECTED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          reason
        }
      })

      // 가맹점 거부
      const updatedMerchant = await tx.merchant.update({
        where: { id: application.merchantId },
        data: {
          status: MerchantStatus.REJECTED
        }
      })

      return updatedMerchant
    })
  },

  /**
   * 가맹점 API 키 발급
   */
  async createApiKey(merchantId: string, name: string, permissions?: any, expiresAt?: Date) {
    const key = this.generateApiKey()

    return await prisma.apiKey.create({
      data: {
        merchantId,
        key,
        name,
        permissions,
        expiresAt
      }
    })
  },

  /**
   * 가맹점 API 키 목록 조회
   */
  async getApiKeys(merchantId: string) {
    return await prisma.apiKey.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' }
    })
  },

  /**
   * API 키 삭제
   */
  async deleteApiKey(id: string, merchantId: string) {
    return await prisma.apiKey.deleteMany({
      where: {
        id,
        merchantId
      }
    })
  },

  /**
   * API 키로 가맹점 조회
   */
  async getMerchantByApiKey(apiKey: string) {
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { merchant: true }
    })

    if (!keyRecord || !keyRecord.isActive) {
      throw new Error('유효하지 않은 API 키입니다.')
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new Error('만료된 API 키입니다.')
    }

    // 마지막 사용 시간 업데이트
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    })

    return keyRecord.merchant
  }
}
