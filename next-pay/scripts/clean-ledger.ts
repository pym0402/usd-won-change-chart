import { prisma } from '../lib/prisma'

async function cleanLedger() {
  console.log('=== 기존 원장 엔트리 및 정산 삭제 ===')

  // 정산 관련 원장 엔트리 삭제
  const deletedLedger = await prisma.ledgerEntry.deleteMany({
    where: {
      referenceType: 'SETTLEMENT'
    }
  })
  console.log(`삭제된 원장 엔트리: ${deletedLedger.count}개`)

  // 정산 삭제
  const deletedSettlements = await prisma.merchantSettlement.deleteMany({})
  console.log(`삭제된 정산: ${deletedSettlements.count}개`)

  console.log('=== 정산 완료 ===')

  await prisma.$disconnect()
}

cleanLedger().catch(console.error)
