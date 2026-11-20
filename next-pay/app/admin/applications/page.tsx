'use client'

import { useState } from 'react'
import { PortalHeading, PortalTable } from '@/app/_portal/portal'
import { usePortalQuery } from '@/app/_portal/use-portal-query'
import styles from '@/app/_portal/portal.module.css'

interface Application {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  reason: string | null
  merchant: { businessName: string; user: { email: string } }
}

const statuses = {
  PENDING: { label: '심사 대기', tone: styles.amber },
  APPROVED: { label: '승인', tone: styles.mint },
  REJECTED: { label: '거절', tone: styles.red },
}

export default function ApplicationsPage() {
  const { result, refresh } = usePortalQuery<Application[]>('/api/merchants/applications')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null)

  const review = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setFeedback(null)
    setSubmitting(true)
    try {
      const response = await fetch(`/api/merchants/applications/${encodeURIComponent(id)}/${action}`, {
        method: 'PUT',
        ...(reason ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) } : {}),
      })
      if (!response.ok) {
        throw new Error(response.status === 401 || response.status === 403
          ? '현재 세션으로 입점 심사를 처리할 수 없습니다.'
          : '입점 심사를 처리하지 못했습니다.')
      }
      setFeedback({ text: action === 'approve' ? '입점 신청을 승인했습니다.' : '입점 신청을 거절했습니다.', error: false })
      refresh()
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : '입점 심사 중 오류가 발생했습니다.', error: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.stack}>
      <PortalHeading title="입점 심사" description="입점 신청을 확인하고 승인 또는 거절하세요." />
      <section className={styles.surface} aria-labelledby="application-list-heading">
        <div className={styles.toolbar}>
          <h2 id="application-list-heading">입점 신청 목록</h2>
          <button type="button" className={styles.button} onClick={refresh} disabled={submitting || result.status === 'loading'}>새로고침</button>
        </div>
        {feedback && <p className={feedback.error ? styles.error : styles.notice} role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p>}
        {result.status === 'loading' && <p className={styles.empty} role="status">신청 목록을 불러오는 중…</p>}
        {result.status === 'error' && <p className={styles.error} role="alert">{result.message}</p>}
        {result.status === 'ready' && (
          result.data.length === 0 ? <p className={styles.empty}>입점 신청이 없습니다.</p> : (
            <PortalTable label="입점 신청 목록">
              <table>
                <thead><tr><th scope="col">가맹점</th><th scope="col">신청일</th><th scope="col">상태</th><th scope="col">심사</th></tr></thead>
                <tbody>
                  {result.data.map((application) => {
                    const { label, tone } = statuses[application.status]
                    return (
                      <tr key={application.id}>
                        <td className={styles.wrapCell}>
                          {application.merchant.businessName}
                          <div className={styles.muted}>{application.merchant.user.email}</div>
                        </td>
                        <td><time dateTime={application.createdAt}>{new Date(application.createdAt).toLocaleDateString('ko-KR')}</time></td>
                        <td><span className={`${styles.badge} ${tone}`}>{label}</span></td>
                        <td className={styles.wrapCell}>
                          {application.status === 'PENDING' ? (
                            <div className={styles.actions}>
                              <button type="button" className={styles.primaryButton} disabled={submitting} onClick={() => {
                                if (window.confirm(`${application.merchant.businessName}의 입점을 승인하시겠습니까?`)) void review(application.id, 'approve')
                              }}>승인</button>
                              <details className={styles.review}>
                                <summary>거절 사유 입력</summary>
                                <form className={styles.field} onSubmit={(event) => {
                                  event.preventDefault()
                                  const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim()
                                  if (reason) void review(application.id, 'reject', reason)
                                }}>
                                  <label htmlFor={`reason-${application.id}`}>거절 사유</label>
                                  <input id={`reason-${application.id}`} name="reason" required />
                                  <button type="submit" className={styles.dangerButton} disabled={submitting}>입점 거절</button>
                                </form>
                              </details>
                            </div>
                          ) : application.reason || '처리 완료'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </PortalTable>
          )
        )}
      </section>
    </div>
  )
}
