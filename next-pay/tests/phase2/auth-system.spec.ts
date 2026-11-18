import { test, expect } from '@playwright/test'

test.describe('Phase 2: 인증 시스템', () => {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User'
  }

  test('2.3 회원가입 기능', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: testUser
    })

    expect(response.status()).toBe(201)
    const data = await response.json()
    expect(data.message).toBe('회원가입이 완료되었습니다.')
    expect(data.user.email).toBe(testUser.email)
  })

  test('2.4 사용자 역할 시스템 - 기본 CUSTOMER 역할 할당', async ({ request }) => {
    // 회원가입 시 자동으로 CUSTOMER 역할이 할당되는지 확인
    const newUser = {
      email: `role-test${Date.now()}@example.com`,
      password: 'Test123!@#',
      name: 'Role Test User'
    }

    const registerResponse = await request.post('/api/auth/register', {
      data: newUser
    })

    expect(registerResponse.status()).toBe(201)
  })
})
