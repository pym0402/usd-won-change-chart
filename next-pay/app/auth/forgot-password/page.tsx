'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AuthFrame, RecoveryResult } from '../auth-frame'
import styles from '../auth.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [copyNotice, setCopyNotice] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setTempPassword('')
    setCopyNotice('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '비밀번호 재설정 중 오류가 발생했습니다.')
        return
      }

      if (typeof data.tempPassword === 'string') {
        setTempPassword(data.tempPassword)
      } else if (data.message) {
        setNotice(data.message)
      }
    } catch {
      setError('비밀번호 재설정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopyNotice('임시 비밀번호를 복사했습니다.')
    } catch {
      setCopyNotice('임시 비밀번호 텍스트를 선택해 복사해 주세요.')
    }
  }

  return (
    <AuthFrame title="비밀번호 찾기" description="가입한 이메일 주소를 입력해 임시 비밀번호를 요청하세요.">
      {tempPassword ? (
        <>
          <RecoveryResult
            title="임시 비밀번호를 발급했습니다"
            label="임시 비밀번호"
            value={tempPassword}
            description="임시 비밀번호로 로그인한 뒤 비밀번호를 변경해 주세요."
          />
          <div className={styles.recoveryActions}>
            <button type="button" className={styles.copyButton} onClick={copyPassword}>임시 비밀번호 복사</button>
            {copyNotice && <p className={styles.hint} role="status">{copyNotice}</p>}
            <Link href="/auth/signin" className={`${styles.submit} ${styles.recoveryLink}`}>로그인 페이지로 이동</Link>
          </div>
        </>
      ) : (
        <>
          {notice ? (
            <p role="status" className={styles.success}>{notice} 받은 비밀번호는 15분 안에 사용해 주세요.</p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              {error && <p role="alert" className={styles.error}>{error}</p>}
              <div className={styles.field}>
                <label htmlFor="email">이메일 주소</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="가입한 이메일 주소"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className={styles.submit}>
                {loading ? '발급 중...' : '임시 비밀번호 발급'}
              </button>
            </form>
          )}
          <nav className={styles.recoveryFooter} aria-label="계정 복구 메뉴">
            <Link href="/auth/signin">로그인으로 돌아가기</Link>
          </nav>
        </>
      )}
    </AuthFrame>
  )
}
