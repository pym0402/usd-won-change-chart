import { test, expect } from '@playwright/test'

test.describe('Phase 5: 결제 시스템', () => {
  test('5.1 Payment Intent 생성 API - 필수 필드 검증', async ({ request }) => {
    const response = await request.post('/api/payments/create-intent', {
      data: {
        // merchantId와 amount 누락
        paymentMethodId: 'test-payment-method-id'
      }
    })
    expect(response.status()).toBe(401)
  })

  test('5.2 결제 승인 API - 필수 필드 검증', async ({ request }) => {
    const response = await request.post('/api/payments/confirm', {
      data: {
        // paymentId 누락
        paymentMethodId: 'test-payment-method-id'
      }
    })
    expect(response.status()).toBe(401)
  })

  test('5.3 결제 상세 조회 API - 인증 없음', async ({ request }) => {
    const response = await request.get('/api/payments/test-payment-id')
    expect(response.status()).toBe(401)
  })

  test('5.4 결제 내역 조회 API - 인증 없음', async ({ request }) => {
    const response = await request.get('/api/payments')
    expect(response.status()).toBe(401)
  })

  test('5.5 결제 취소 API - 인증 없음', async ({ request }) => {
    const response = await request.post('/api/payments/test-payment-id/cancel', {
      data: { reason: 'Test reason' }
    })
    expect(response.status()).toBe(401)
  })

  test('5.6 웹훅 API - 서명 없음', async ({ request }) => {
    const response = await request.post('/api/payments/webhook', {
      data: { test: 'data' }
    })
    expect(response.status()).toBe(400)
  })
})
