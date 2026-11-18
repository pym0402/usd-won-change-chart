import { test, expect } from '@playwright/test'

test.describe('Phase 7: 가맹점 대시보드 E2E 테스트', () => {
  test('가맹점 대시보드 - 정산 요약 표시 검증', async ({ page }) => {
    await page.goto('/merchant')

    await expect(page.locator('h2')).toContainText('가맹점 대시보드')

    await expect(page.locator('text=총 결제 금액')).toBeVisible()
    await expect(page.locator('text=총 수수료')).toBeVisible()
    await expect(page.locator('text=총 정산 금액')).toBeVisible()
    await expect(page.locator('text=정산 대기')).toBeVisible()

    const grossAmountElement = page.locator('.grid').filter({ hasText: '총 결제 금액' }).locator('p').first()
    await expect(grossAmountElement).toBeVisible()

    const commissionElement = page.locator('.grid').filter({ hasText: '총 수수료' }).locator('p').first()
    await expect(commissionElement).toBeVisible()

    const netAmountElement = page.locator('.grid').filter({ hasText: '총 정산 금액' }).locator('p').first()
    await expect(netAmountElement).toBeVisible()

    const pendingCountElement = page.locator('.grid').filter({ hasText: '정산 대기' }).locator('p').first()
    await expect(pendingCountElement).toBeVisible()
  })

  test('가맹점 대시보드 - 정산 예정액 및 지급 내역 데이터 확인', async ({ page, request }) => {
    const apiResponse = await request.get('/api/settlements/summary')
    expect(apiResponse.ok()).toBeTruthy()

    const apiData = await apiResponse.json()

    await page.goto('/merchant')

    await page.waitForLoadState('networkidle')

    const grossAmountText = await page.locator('.grid').filter({ hasText: '총 결제 금액' }).locator('p').first().textContent()
    const commissionText = await page.locator('.grid').filter({ hasText: '총 수수료' }).locator('p').first().textContent()
    const netAmountText = await page.locator('.grid').filter({ hasText: '총 정산 금액' }).locator('p').first().textContent()
    const pendingCountText = await page.locator('.grid').filter({ hasText: '정산 대기' }).locator('p.text-yellow-600').textContent()

    expect(grossAmountText).toContain('원')
    expect(commissionText).toContain('원')
    expect(netAmountText).toContain('원')
    expect(pendingCountText).toMatch(/\d+건/)
  })

  test('가맹점 대시보드 - 빠른 링크 표시 확인', async ({ page }) => {
    await page.goto('/merchant')

    await expect(page.locator('h3').filter({ hasText: '정산 내역' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: 'API 키 관리' })).toBeVisible()
    await expect(page.locator('h3').filter({ hasText: '결제 내역' })).toBeVisible()

    const settlementLink = page.locator('a').filter({ hasText: '정산 내역' })
    await expect(settlementLink).toHaveAttribute('href', '/merchant/settlements')
  })
})
