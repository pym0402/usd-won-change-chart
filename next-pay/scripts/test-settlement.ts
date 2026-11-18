import { prisma } from '../lib/prisma'
import { settlementService } from '../services/settlementService'
import { PaymentStatus } from '@prisma/client'

async function testSettlement() {
  console.log('=== 정산 테스트 시작 ===')

  // 테스트용 결제 생성 (기존 결제 재사용)
  const payment = await prisma.payment.findFirst({
    where: {
      status: PaymentStatus.COMPLETED
    },
    include: {
      merchant: true
    }
  })

  if (!payment) {
    console.error('완료된 결제를 찾을 수 없습니다.')
    await prisma.$disconnect()
    return
  }

  console.log(`결제 ID: ${payment.id}`)
  console.log(`결제 금액: ${payment.amount}원`)
  console.log(`가맹점 수수료율: ${payment.merchant.commissionRate}`)

  // 정산 생성
  console.log('\n정산 생성 중...')
  const settlement = await settlementService.createSettlement(payment.id)
  console.log(`정산 생성 완료: ${settlement.id}`)
  console.log(`수수료: ${settlement.commission}원`)
  console.log(`순수익: ${settlement.netAmount}원`)

  // 원장 엔트리 확인
  const ledgerEntries = await prisma.ledgerEntry.findMany({
    where: {
      referenceId: settlement.id
    }
  })

  console.log('\n=== 생성된 원장 엔트리 ===')
  let totalDebit = 0
  let totalCredit = 0

  ledgerEntries.forEach((entry, index) => {
    console.log(`[${index + 1}] ${entry.accountType}: Debit=${entry.debit}, Credit=${entry.credit}`)
    totalDebit += entry.debit
    totalCredit += entry.credit
  })

  console.log(`\n차변 합계: ${totalDebit}`)
  console.log(`대변 합계: ${totalCredit}`)
  console.log(`무결성: ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'PASS' : 'FAIL'}`)

  // 전체 원장 무결성 검증
  const allEntries = await prisma.ledgerEntry.findMany()
  const totalDebitAll = allEntries.reduce((sum, e) => sum + e.debit, 0)
  const totalCreditAll = allEntries.reduce((sum, e) => sum + e.credit, 0)

  console.log('\n=== 전체 원장 무결성 ===')
  console.log(`차변 합계: ${totalDebitAll}`)
  console.log(`대변 합계: ${totalCreditAll}`)
  console.log(`무결성: ${Math.abs(totalDebitAll - totalCreditAll) < 0.01 ? 'PASS' : 'FAIL'}`)

  await prisma.$disconnect()
}

testSettlement().catch(console.error)
