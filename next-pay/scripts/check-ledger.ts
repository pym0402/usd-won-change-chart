import { prisma } from '../lib/prisma'

async function checkLedger() {
  const entries = await prisma.ledgerEntry.findMany({
    orderBy: { createdAt: 'asc' }
  })

  console.log('=== 원장 엔트리 상세 내역 ===')
  console.log(`총 엔트리 수: ${entries.length}`)
  console.log()

  let totalDebit = 0
  let totalCredit = 0

  entries.forEach((entry, index) => {
    console.log(`[${index + 1}] ID: ${entry.id}`)
    console.log(`    Reference: ${entry.referenceType} - ${entry.referenceId}`)
    console.log(`    Account: ${entry.accountType}`)
    console.log(`    Debit: ${entry.debit}, Credit: ${entry.credit}`)
    console.log(`    Description: ${entry.description}`)
    console.log(`    Created: ${entry.createdAt}`)
    console.log()

    totalDebit += entry.debit
    totalCredit += entry.credit
  })

  console.log('=== 요약 ===')
  console.log(`차변 합계: ${totalDebit}`)
  console.log(`대변 합계: ${totalCredit}`)
  console.log(`차이: ${Math.abs(totalDebit - totalCredit)}`)
  console.log(`무결성: ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'PASS' : 'FAIL'}`)

  await prisma.$disconnect()
}

checkLedger().catch(console.error)
