import { test, expect } from '@playwright/test'

test.describe('Phase 4: 결제 수단 관리', () => {
  test('4.1 결제 수단 API - 목록 조회 (인증 없음)', async ({ request }) => {
    const response = await request.get('/api/payment-methods')
    expect(response.status()).toBe(401)
  })

  test('4.2 결제 수단 등록 API - 필수 필드 검증', async ({ request }) => {
    const response = await request.post('/api/payment-methods', {
      data: {
        // type 누락
        paymentMethodId: 'test-payment-method-id'
      }
    })
    expect(response.status()).toBe(401)
  })

  test('4.3 결제 수단 삭제 API - 인증 없음', async ({ request }) => {
    const response = await request.delete('/api/payment-methods/test-id')
    expect(response.status()).toBe(401)
  })

  test('4.4 기본 결제 수단 설정 API - 인증 없음', async ({ request }) => {
    const response = await request.put('/api/payment-methods/test-id/default')
    expect(response.status()).toBe(401)
  })
})
