import { test, expect } from '@playwright/test'

test.describe('Phase 1: 프로젝트 설정 및 기본 인프라', () => {
  test('1.1 Next.js 프로젝트 기본 페이지 렌더링', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Next Pay/)
  })

  test('1.4 데이터베이스 연결 테스트', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBeTruthy()
  })

  test('1.5 폴더 구조 존재 확인', async () => {
    const fs = require('fs')
    const path = require('path')

    const requiredFolders = [
      'app',
      'components',
      'lib',
      'services',
      'types',
      'prisma'
    ]

    for (const folder of requiredFolders) {
      const folderPath = path.join(process.cwd(), folder)
      expect(fs.existsSync(folderPath)).toBeTruthy()
    }
  })

  test('1.7 라우트 그룹 구조 접근 가능 확인', async ({ page }) => {
    // 라우트 그룹 접근 테스트 (인증 없이도 레이아웃 로드 확인)
    await page.goto('/customer')
    await expect(page.locator('h1')).toContainText('고객 포털')

    await page.goto('/merchant')
    await expect(page.locator('h1')).toContainText('가맹점 포털')

    await page.goto('/admin')
    await expect(page.locator('h1')).toContainText('관리자 포털')
  })
})
