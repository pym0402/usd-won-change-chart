'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthFrame } from '../auth-frame'
import styles from '../auth.module.css'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '비밀번호 재설정 중 오류가 발생했습니다.')
        return
      }

      if (data.message) {
        setNotice(data.message)
      }
    } catch (error) {
      setError('비밀번호 재설정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame
      title="비밀번호 찾기"
      description="가입한 이메일 주소로 임시 비밀번호를 받아 로그인할 수 있어요."
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p role="alert" className={styles.error}>{error}</p>}

        {notice ? (
          <p role="status" className={styles.success}>{notice} 받은 비밀번호는 15분 안에 사용해 주세요.</p>
        ) : (
          <>
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
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.submit}>
              {loading ? '발급 중...' : '임시 비밀번호 발급'}
            </button>
          </>
        )}
      </form>

      <nav className={styles.recoveryFooter} aria-label="계정 복구 메뉴">
        <Link href="/auth/signin">로그인으로 돌아가기</Link>
      </nav>
    </AuthFrame>
  )
}
