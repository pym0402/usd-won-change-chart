import { test, expect } from '@playwright/test'

test.describe('Phase 7: 관리자 대시보드 E2E 테스트', () => {
  test('관리자 대시보드 - 플랫폼 통계 표시 검증', async ({ page }) => {
    await page.goto('/admin')

    await expect(page.locator('h2')).toContainText('관리자 대시보드')

    await expect(page.locator('text=GMV')).toBeVisible()
    await expect(page.locator('text=수수료 수익')).toBeVisible()
    await expect(page.locator('text=활성 가맹점')).toBeVisible()
    await expect(page.locator('text=정산 대기')).toBeVisible()

    const gmvElement = page.locator('.grid').filter({ hasText: 'GMV' }).locator('p').first()
    await expect(gmvElement).toBeVisible()

    const commissionElement = page.locator('.grid').filter({ hasText: '수수료 수익' }).locator('p').first()
    await expect(commissionElement).toBeVisible()
  })

  test('관리자 대시보드 - GMV 및 수수료 수익 데이터 확인', async ({ page, request }) => {
    const apiResponse = await request.get('/api/admin/dashboard')
    expect(apiResponse.ok()).toBeTruthy()

    const apiData = await apiResponse.json()

    await page.goto('/admin')

    await page.waitForLoadState('networkidle')

    const gmvText = await page.locator('.grid').filter({ hasText: 'GMV' }).locator('p').first().textContent()
    const commissionText = await page.locator('.grid').filter({ hasText: '수수료 수익' }).locator('p').first().textContent()

    expect(gmvText).toContain('원')
    expect(commissionText).toContain('원')
  })

  test('관리자 대시보드 - 정산 대기 목록 표시 확인', async ({ page }) => {
    await page.goto('/admin')

    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=정산 승인 대기 목록')).toBeVisible()

    const settlementRows = page.locator('tbody tr')
    const count = await settlementRows.count()

    if (count > 0) {
      await expect(page.locator('th').filter({ hasText: '가맹점' })).toBeVisible()
      await expect(page.locator('th').filter({ hasText: '결제 ID' })).toBeVisible()
      await expect(page.locator('th').filter({ hasText: '총 금액' })).toBeVisible()
      await expect(page.locator('th').filter({ hasText: '수수료' })).toBeVisible()
      await expect(page.locator('th').filter({ hasText: '정산 금액' })).toBeVisible()
    }
  })

  test('관리자 대시보드 - 정산 승인 기능 표시 확인', async ({ page }) => {
    await page.goto('/admin')

    await page.waitForLoadState('networkidle')

    const approveButtons = page.locator('button').filter({ hasText: '승인' })
    const count = await approveButtons.count()

    if (count > 0) {
      await expect(approveButtons.first()).toBeVisible()
    }
  })
})
