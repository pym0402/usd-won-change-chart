'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { AuthFrame } from '../auth-frame'
import styles from '../auth.module.css'

export function PasswordForm({ temporary }: { temporary: boolean }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (next !== confirm) {
      setError('새 비밀번호 확인이 일치하지 않습니다.')
      return
    }
    setSaving(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || '비밀번호를 변경할 수 없습니다.')
        return
      }
      setCurrent('')
      setNext('')
      setConfirm('')
      await signOut({ redirect: false }).catch(() => {})
      setSuccess(true)
    } catch {
      setError('비밀번호 변경 요청 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthFrame title="비밀번호 변경" description={temporary
      ? '임시 비밀번호로 로그인했습니다. 새 비밀번호를 설정한 뒤 다시 로그인해 주세요.'
      : '현재 비밀번호를 확인한 뒤 새 비밀번호를 설정하세요.'}>
      {success ? (
        <p role="status" className={styles.success}>비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.</p>
      ) : (
        <form className={styles.form} onSubmit={submit}>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <div className={styles.field}>
            <label htmlFor="current-password">{temporary ? '임시 비밀번호' : '현재 비밀번호'}</label>
            <input id="current-password" autoComplete="current-password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="new-password">새 비밀번호</label>
            <input id="new-password" autoComplete="new-password" type="password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required aria-describedby="new-password-hint" />
            <p id="new-password-hint" className={styles.hint}>8자 이상, UTF-8 기준 72바이트 이하로 입력하세요.</p>
          </div>
          <div className={styles.field}>
            <label htmlFor="confirm-password">새 비밀번호 확인</label>
            <input id="confirm-password" autoComplete="new-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <button type="submit" disabled={saving} className={styles.submit}>{saving ? '변경 중...' : '비밀번호 변경'}</button>
        </form>
      )}
      {success && <nav className={styles.recoveryFooter} aria-label="로그인 메뉴"><Link href="/auth/signin">로그인으로 돌아가기</Link></nav>}
    </AuthFrame>
  )
}
