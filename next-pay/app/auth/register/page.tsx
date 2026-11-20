'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthFrame, AuthSuccess } from '../auth-frame'
import styles from '../auth.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '회원가입 중 오류가 발생했습니다.')
        return
      }

      setSuccess(true)
      setShowPopup(true)
      setLoading(false)
    } catch (error) {
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      if (!success) {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <AuthFrame
        title="회원가입"
        description="계정을 만들고 포인트 충전과 간편결제를 시작하세요."
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <div className={styles.field}>
            <label htmlFor="name">이름</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="이름"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="이메일 주소"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-describedby="password-hint"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleChange}
            />
            <p id="password-hint" className={styles.hint}>최소 8자 이상 입력해 주세요.</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="비밀번호 확인"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submit}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className={styles.switch}>이미 계정이 있으신가요? <Link href="/auth/signin">로그인</Link></p>
      </AuthFrame>

      {showPopup && (
        <AuthSuccess
          title="회원가입 완료"
          onConfirm={() => {
            setShowPopup(false)
            router.push('/auth/signin?registered=true')
          }}
        />
      )}
    </>
  )
}
