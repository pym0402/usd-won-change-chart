'use client'

import { BookOpen, Scale } from 'lucide-react'
import { PortalHeading, PortalMetric, PortalTable } from '@/app/_portal/portal'
import { usePortalQuery } from '@/app/_portal/use-portal-query'
import styles from '@/app/_portal/portal.module.css'

interface LedgerOverview {
  isValid: boolean
  totalDebit: number
  totalCredit: number
  totalEntries: number
}

export default function LedgerPage() {
  const { result, refresh } = usePortalQuery<LedgerOverview>('/api/ledger/validate')

  return (
    <div className={styles.stack}>
      <PortalHeading title="복식부기 원장" description="원장에 기록된 차변·대변 합계와 서버의 균형 검증 결과를 확인하세요." />
      <section className={styles.surface} aria-labelledby="ledger-heading">
        <div className={styles.toolbar}>
          <h2 id="ledger-heading">원장 검증 요약</h2>
          <button type="button" className={styles.button} onClick={refresh} disabled={result.status === 'loading'}>다시 검증</button>
        </div>
        {result.status === 'loading' && <p className={styles.empty} role="status">원장 검증 결과를 불러오는 중…</p>}
        {result.status === 'error' && (
          <p className={styles.error} role="alert">
            {result.detail?.startsWith('원장 무결성 위반:')
              ? '원장 검증 실패. 차변과 대변의 합계가 일치하지 않습니다.'
              : '원장 검증 결과를 확인할 수 없습니다.'}
          </p>
        )}
        {result.status === 'ready' && (
          <div className={styles.sectionContent}>
            <div className={styles.metrics}>
              <PortalMetric title="검증 결과" value={result.data.isValid ? '균형 일치' : '검증 실패'} icon={Scale} highlight />
              <PortalMetric title="원장 항목 수" value={`${result.data.totalEntries.toLocaleString()}건`} icon={BookOpen} />
            </div>
            <PortalTable label="차변 및 대변 합계">
              <table>
                <thead><tr><th scope="col">구분</th><th scope="col">합계</th></tr></thead>
                <tbody>
                  <tr><td>차변</td><td>{result.data.totalDebit.toLocaleString()}원</td></tr>
                  <tr><td>대변</td><td>{result.data.totalCredit.toLocaleString()}원</td></tr>
                </tbody>
              </table>
            </PortalTable>
          </div>
        )}
      </section>
    </div>
  )
}
