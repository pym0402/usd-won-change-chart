'use client'

import Link from 'next/link'
import { PortalHeading, PortalTable } from '@/app/_portal/portal'
import { usePortalQuery } from '@/app/_portal/use-portal-query'
import styles from '@/app/_portal/portal.module.css'

interface PaymentList {
  payments: Array<{
    id: string
    createdAt: string
    amount: number
    pointAmount: number
    cardAmount: number
    status: string
  }>
  pagination: { total: number }
}

const paymentStatuses = new Map([
  ['PENDING', ['대기', styles.amber]],
  ['PROCESSING', ['처리 중', styles.blue]],
  ['COMPLETED', ['완료', styles.mint]],
  ['FAILED', ['실패', styles.red]],
  ['REFUNDED', ['환불', '']],
  ['PARTIALLY_REFUNDED', ['부분 환불', '']],
])

export default function MerchantPaymentsPage() {
  const { result, refresh } = usePortalQuery<PaymentList>('/api/payments?scope=merchant')

  return (
    <div className={styles.stack}>
      <PortalHeading title="결제 내역" description="최근 결제 상태와 카드·포인트 사용 금액을 확인하세요." />
      <section className={styles.surface} aria-labelledby="payment-list-heading">
        <div className={styles.toolbar}>
          <h2 id="payment-list-heading">최근 결제 목록</h2>
          <button type="button" className={styles.button} onClick={refresh} disabled={result.status === 'loading'}>새로고침</button>
        </div>
        {result.status === 'loading' && <p className={styles.empty} role="status">결제 내역을 불러오는 중…</p>}
        {result.status === 'error' && (
          <p className={styles.error} role="alert">
            {result.message} 지급 내역은 <Link className={styles.textLink} href="/merchant/settlements">정산 내역</Link>에서 확인할 수 있습니다.
          </p>
        )}
        {result.status === 'ready' && (
          result.data.payments.length === 0 ? <p className={styles.empty}>결제 내역이 없습니다.</p> : (
            <>
              <p className={styles.muted}>전체 {result.data.pagination.total.toLocaleString()}건 중 최근 {result.data.payments.length.toLocaleString()}건</p>
              <PortalTable label="최근 결제 목록">
                <table>
                  <thead>
                    <tr><th scope="col">결제 ID</th><th scope="col">결제일</th><th scope="col">총 결제액</th><th scope="col">카드</th><th scope="col">포인트</th><th scope="col">상태</th></tr>
                  </thead>
                  <tbody>
                    {result.data.payments.map((payment) => {
                      const [label, tone] = paymentStatuses.get(payment.status) ?? [payment.status, '']
                      return (
                        <tr key={payment.id}>
                          <td className={styles.wrapCell}>{payment.id}</td>
                          <td><time dateTime={payment.createdAt}>{new Date(payment.createdAt).toLocaleDateString('ko-KR')}</time></td>
                          <td>{payment.amount.toLocaleString()}원</td>
                          <td>{payment.cardAmount.toLocaleString()}원</td>
                          <td>{payment.pointAmount.toLocaleString()} P</td>
                          <td><span className={`${styles.badge} ${tone}`}>{label}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </PortalTable>
            </>
          )
        )}
      </section>
    </div>
  )
}
