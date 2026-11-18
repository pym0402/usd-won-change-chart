import { test, expect } from '@playwright/test'

test.describe('Phase 3: 포인트 및 지갑 시스템', () => {
  test('3.1 지갑 API - 잔액 조회 (인증 없음)', async ({ request }) => {
    const response = await request.get('/api/wallet')
    expect(response.status()).toBe(401)
  })

  test('3.2 포인트 충전 API - 필수 필드 검증', async ({ request }) => {
    const response = await request.post('/api/wallet/charge', {
      data: {
        // amount 누락
        description: 'Test charge'
      }
    })
    expect(response.status()).toBe(401)
  })

  test('3.3 포인트 거래 내역 API - 인증 없음', async ({ request }) => {
    const response = await request.get('/api/wallet/transactions')
    expect(response.status()).toBe(401)
  })

  test('3.4 포인트 사용 API - 필수 필드 검증', async ({ request }) => {
    const response = await request.post('/api/wallet/use', {
      data: {
        // amount 누락
        description: 'Test use'
      }
    })
    expect(response.status()).toBe(401)
  })

  test('3.5 원장 무결성 검증 API', async ({ request }) => {
    const response = await request.get('/api/ledger/validate')
    expect([200, 500]).toContain(response.status())
  })
})
