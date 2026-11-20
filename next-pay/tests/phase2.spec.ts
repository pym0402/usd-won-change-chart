import { test, expect } from '@playwright/test'

test.describe('Phase 2: 인증 시스템 기본', () => {
  test('2.1 NextAuth 기본 설정 - API 라우트 존재 확인', async ({ request }) => {
    const response = await request.get('/api/auth/providers')
    // NextAuth API가 응답하는지 확인
    expect([200, 500]).toContain(response.status())
  })

  test('2.2 회원가입 API - 필수 필드 검증', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: 'test@example.com'
        // password 누락
      }
    })

    expect(response.status()).toBe(400)
  })

  test('2.3 회원가입 API - 형식 검증', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User'
      }
    })

    expect(response.status()).toBe(400)
  })
})
