import { prisma } from './lib/prisma'
import { PaymentStatus, SettlementStatus, MerchantStatus } from '@prisma/client'

async function testSettlement() {
  console.log('=== 정산 시스템 테스트 시작 ===\n')

  try {
    // 1. 테스트용 사용자 생성
    console.log('1. 테스트 사용자 생성...')
    const customer = await prisma.user.upsert({
      where: { email: 'test-customer@example.com' },
      update: {},
      create: {
        email: 'test-customer@example.com',
        name: '테스트 고객',
        password: 'hashed_password'
      }
    })

    const merchantUser = await prisma.user.upsert({
      where: { email: 'test-merchant@example.com' },
      update: {},
      create: {
        email: 'test-merchant@example.com',
        name: '테스트 가맹점',
        password: 'hashed_password'
      }
    })

    // 역할 할당
    const customerRole = await prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: { name: 'CUSTOMER', description: '고객' }
    })

    const merchantRole = await prisma.role.upsert({
      where: { name: 'MERCHANT' },
      update: {},
      create: { name: 'MERCHANT', description: '가맹점' }
    })

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: customer.id,
          roleId: customerRole.id
        }
      },
      update: {},
      create: {
        userId: customer.id,
        roleId: customerRole.id
      }
    })

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: merchantUser.id,
          roleId: merchantRole.id
        }
      },
      update: {},
      create: {
        userId: merchantUser.id,
        roleId: merchantRole.id
      }
    })

    console.log(`   고객 ID: ${customer.id}`)
    console.log(`   가맹점 사용자 ID: ${merchantUser.id}\n`)

    // 2. 가맹점 생성 (수수료율 2.5%)
    console.log('2. 가맹점 생성...')
    const merchant = await prisma.merchant.upsert({
      where: { userId: merchantUser.id },
      update: {},
      create: {
        userId: merchantUser.id,
        businessName: '테스트 상점',
        status: MerchantStatus.APPROVED,
        commissionRate: 0.025,
        bankAccount: '1234567890123456',
        bankName: '국민은행'
      }
    })

    console.log(`   가맹점 ID: ${merchant.id}`)
    console.log(`   수수료율: ${merchant.commissionRate * 100}%\n`)

    // 3. 완료된 결제 생성
    console.log('3. 완료된 결제 생성...')
    const payment = await prisma.payment.create({
      data: {
        merchantId: merchant.id,
        customerId: customer.id,
        amount: 10000,
        currency: 'KRW',
        status: PaymentStatus.COMPLETED,
        pointAmount: 0,
        cardAmount: 10000,
        idempotencyKey: `test_${Date.now()}`,
        metadata: { test: true }
      }
    })

    console.log(`   결제 ID: ${payment.id}`)
    console.log(`   결제 금액: ${payment.amount}원\n`)

    // 4. 정산 생성 테스트
    console.log('4. 정산 생성 테스트...')
    const { settlementService } = await import('./services/settlementService')

    const settlement = await settlementService.createSettlement(payment.id)

    console.log(`   정산 ID: ${settlement.id}`)
    console.log(`   총 결제 금액: ${settlement.grossAmount}원`)
    console.log(`   수수료: ${settlement.commission}원`)
    console.log(`   순수익: ${settlement.netAmount}원`)
    console.log(`   상태: ${settlement.status}\n`)

    // 5. 계산 검증
    console.log('5. 계산 검증...')
    const expectedCommission = 10000 * 0.025
    const expectedNetAmount = 10000 - expectedCommission

    console.log(`   예상 수수료: ${expectedCommission}원`)
    console.log(`   실제 수수료: ${settlement.commission}원`)
    console.log(`   수수료 일치: ${settlement.commission === expectedCommission ? '✓' : '✗'}`)

    console.log(`   예상 순수익: ${expectedNetAmount}원`)
    console.log(`   실제 순수익: ${settlement.netAmount}원`)
    console.log(`   순수익 일치: ${settlement.netAmount === expectedNetAmount ? '✓' : '✗'}\n`)

    // 6. 원장 엔트리 확인
    console.log('6. 원장 엔트리 확인...')
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: {
        referenceId: settlement.id,
        referenceType: 'SETTLEMENT'
      }
    })

    console.log(`   원장 엔트리 수: ${ledgerEntries.length}`)

    let totalDebit = 0
    let totalCredit = 0

    for (const entry of ledgerEntries) {
      console.log(`   - ${entry.accountType}: 차변=${entry.debit}, 대변=${entry.credit}`)
      totalDebit += entry.debit
      totalCredit += entry.credit
    }

    console.log(`   총 차변: ${totalDebit}원`)
    console.log(`   총 대변: ${totalCredit}원`)
    console.log(`   무결성: ${Math.abs(totalDebit - totalCredit) < 0.01 ? '✓' : '✗'}\n`)

    // 7. 정산 내역 조회 테스트
    console.log('7. 정산 내역 조회 테스트...')
    const settlements = await settlementService.getSettlements(merchant.id)
    console.log(`   가맹점 정산 내역 수: ${settlements.length}\n`)

    // 8. 정산 승인 테스트
    console.log('8. 정산 승인 테스트...')
    const approvedSettlement = await settlementService.approveSettlement(
      settlement.id,
      'TXN123456789'
    )

    console.log(`   승인 후 상태: ${approvedSettlement.status}`)
    console.log(`   승인 일시: ${approvedSettlement.settledAt}\n`)

    console.log('=== 테스트 완료 ===')
  } catch (error) {
    console.error('테스트 오류:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testSettlement()
