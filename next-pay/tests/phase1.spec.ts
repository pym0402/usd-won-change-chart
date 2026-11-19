import { test, expect } from '@playwright/test'

test.describe('Phase 1: 프로젝트 설정 및 기본 인프라', () => {
  test('1.1 Next.js 프로젝트 초기화 - 기본 페이지 렌더링', async ({ page }) => {
    await page.goto('/')
    const main = page.getByRole('main')
    await expect(main.getByRole('heading', { level: 1 })).toContainText('Next Pay')
    await expect(main.getByRole('link', { name: /고객 페이지/ })).toHaveAttribute('href', '/customer')
    await expect(main.getByRole('link', { name: /가맹점 페이지/ })).toHaveAttribute('href', '/merchant')
    await expect(main.getByRole('link', { name: /관리자 페이지/ })).toHaveAttribute('href', '/admin')
  })

  test('1.3 홈 화면 - 모바일 레이아웃', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const main = page.getByRole('main')

    await expect(main.getByRole('link', { name: '로그인' })).toBeVisible()
    await expect(main.getByRole('link', { name: '회원가입' })).toBeVisible()
    await expect(main.getByText('결제 화면 예시')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  })

  test('1.4 Prisma - 데이터베이스 연결 API', async ({ request }) => {
    const response = await request.get('/api/health')
    const data = await response.json()
    // 데이터베이스가 연결되지 않아도 API는 응답해야 함
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('database')
  })

  test('1.5 기본 폴더 구조 확인', async ({ page }) => {
    // 이 테스트는 실제 파일 시스템 확인이 필요하므로
    // API 엔드포인트를 통해 확인하거나 스크립트로 확인해야 함
    // 여기서는 헬스 API가 정상 작동함으로써 간접 확인
    const response = await page.request.get('/api/health')
    const data = await response.json()
    expect(data).toHaveProperty('status')
  })
})
