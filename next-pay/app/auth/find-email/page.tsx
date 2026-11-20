'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthFrame, RecoveryResult } from '../auth-frame'
import styles from '../auth.module.css'

export default function FindEmailPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [foundEmail, setFoundEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFoundEmail('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/find-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '이메일 찾기 중 오류가 발생했습니다.')
        return
      }

      if (data.email) {
        setFoundEmail(data.email)
      } else {
        setError('해당 이름으로 등록된 계정을 찾을 수 없습니다.')
      }
    } catch (error) {
      setError('이메일 찾기 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame
      title="이메일 찾기"
      description="가입할 때 입력한 이름으로 계정의 이메일 주소를 확인하세요."
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p role="alert" className={styles.error}>{error}</p>}

        {foundEmail ? (
          <RecoveryResult
            title="이메일을 찾았습니다"
            label="가입 이메일"
            value={foundEmail}
          />
        ) : (
          <>
            <div className={styles.field}>
              <label htmlFor="name">이름</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="가입할 때 입력한 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.submit}>
              {loading ? '찾는 중...' : '이메일 찾기'}
            </button>
          </>
        )}
      </form>

      <nav className={styles.recoveryFooter} aria-label="계정 복구 메뉴">
        <Link href="/auth/signin">로그인으로 돌아가기</Link>
        {foundEmail && <Link href="/auth/forgot-password">비밀번호 찾기</Link>}
      </nav>
    </AuthFrame>
  )
}
