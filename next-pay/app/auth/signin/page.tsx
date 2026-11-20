'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthFrame, AuthSuccess } from '../auth-frame'
import styles from '../auth.module.css'

export default function SignInPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  const getRedirectUrl = () => {
    const userRoles = session?.user?.roles ?? []
    if (userRoles.includes('ADMIN')) {
      return '/admin'
    } else if (userRoles.includes('MERCHANT')) {
      return '/merchant'
    } else if (userRoles.includes('CUSTOMER')) {
      return '/customer/wallet'
    }
    return '/'
  }

  useEffect(() => {
    if (status === 'authenticated' && session && !showPopup) {
      const redirectUrl = getRedirectUrl()
      router.push(redirectUrl)
    }

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('registered') === 'true') {
      setRegistered(true)
      setTimeout(() => setRegistered(false), 5000)
    }
  }, [status, session, router, showPopup])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('[Frontend] 로그인 시도:', { email })

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      console.log('[Frontend] signIn 결과:', result)

      if (result?.error) {
        const errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
        setError(errorMessage)
        alert(errorMessage)
      } else if (result?.ok) {
        console.log('[Frontend] 로그인 성공, 홈페이지로 리다이렉트')
        setLoginSuccess(true)
        setShowPopup(true)
      } else {
        const errorMessage = '로그인 중 오류가 발생했습니다.'
        setError(errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      console.error('[Frontend] 로그인 에러:', error)
      const errorMessage = '로그인 중 오류가 발생했습니다.'
      setError(errorMessage)
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' })
  }

  const handleGitHubSignIn = () => {
    signIn('github', { callbackUrl: '/' })
  }

  return (
    <>
      <AuthFrame
        title="로그인"
        description="내 지갑과 결제 내역을 확인하고 Next Pay를 이용하세요."
        aside={
          <>
            <h2 id="demo-accounts">테스트용 계정</h2>
            <p>공통 비밀번호 <code>test1234</code></p>
            <dl className={styles.accounts}>
              <div><dt>고객</dt><dd><code>customer@test.com</code></dd></div>
              <div><dt>가맹점</dt><dd><code>merchant@test.com</code></dd></div>
              <div><dt>관리자</dt><dd><code>admin@test.com</code></dd></div>
            </dl>
          </>
        }
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          {registered && (
            <p role="status" className={styles.success}>회원가입이 완료되었습니다. 로그인해 주세요.</p>
          )}
          {error && <p role="alert" className={styles.error}>{error}</p>}

          <div className={styles.field}>
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className={styles.submit}>
            {loading ? '로그인 중...' : '로그인'}
          </button>

          {/* 소셜 로그인은 아직 설정되지 않음 - 주석 처리
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">또는</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Google
            </button>
            <button
              type="button"
              onClick={handleGitHubSignIn}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              GitHub
            </button>
          </div>
          */}
        </form>

        <nav className={styles.recovery} aria-label="계정 복구">
          <Link href="/auth/find-email">이메일 찾기</Link>
          <Link href="/auth/forgot-password">비밀번호 찾기</Link>
        </nav>
        <p className={styles.switch}>계정이 없으신가요? <Link href="/auth/register">회원가입</Link></p>
      </AuthFrame>

      {showPopup && (
        <AuthSuccess
          title="로그인 완료"
          onConfirm={() => {
            setShowPopup(false)
            window.location.href = '/'
          }}
        />
      )}
    </>
  )
}
