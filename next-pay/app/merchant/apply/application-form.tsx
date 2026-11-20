'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/app/_portal/portal.module.css'

export function ApplicationForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, startTransition] = useTransition()
  const busy = submitting || refreshing

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    const form = new FormData(event.currentTarget)
    const businessName = String(form.get('businessName') ?? '').trim()
    const businessLicense = String(form.get('businessLicense') ?? '').trim()
    const description = String(form.get('description') ?? '').trim()
    if (!businessName) {
      setError('상호명을 입력해 주세요.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const response = await fetch('/api/merchants/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          businessLicense: businessLicense || undefined,
          description: description || undefined,
        }),
      })
      if (!response.ok) {
        const failure = await response.json().catch(() => null)
        setError(typeof failure?.error === 'string' ? failure.error : '입점 신청을 제출하지 못했습니다.')
      }
      startTransition(() => router.refresh())
    } catch {
      setError('입점 신청을 제출하지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.sectionContent} onSubmit={submit} aria-busy={busy}>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.field}>
        <label htmlFor="businessName">상호명 (필수)</label>
        <input id="businessName" name="businessName" autoComplete="organization" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="businessLicense">사업자등록번호 (선택)</label>
        <input id="businessLicense" name="businessLicense" placeholder="000-00-00000" />
      </div>
      <div className={styles.field}>
        <label htmlFor="description">가맹점 소개 (선택)</label>
        <textarea id="description" name="description" rows={4} />
      </div>
      <div>
        <button type="submit" className={styles.primaryButton} disabled={busy}>
          {busy ? '신청 처리 중…' : '입점 신청하기'}
        </button>
      </div>
    </form>
  )
}
