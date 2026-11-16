'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    const userRoles = (session?.user as any)?.roles || []
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
    if (status === 'authenticated' && session) {
      const redirectUrl = getRedirectUrl()
      router.push(redirectUrl)
    }

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('registered') === 'true') {
      setRegistered(true)
      setTimeout(() => setRegistered(false), 5000)
    }
  }, [status, session, router])

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

        setTimeout(() => {
          setShowPopup(false)
          window.location.href = '/'
        }, 2000)
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Next Pay 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            간편결제 서비스에 로그인하세요
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {registered && (
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              회원가입이 완료되었습니다! 로그인해주세요.
            </div>
          )}

          {error && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm shadow-md">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>

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

          <div className="text-center">
            <Link
              href="/auth/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              계정이 없으신가요? 회원가입
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-2">테스트용 계정 (비밀번호: test1234)</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>관리자:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">admin@test.com</code>
              </div>
              <div className="flex justify-between">
                <span>가맹점:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">merchant@test.com</code>
              </div>
              <div className="flex justify-between">
                <span>고객:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">customer@test.com</code>
              </div>
            </div>
          </div>
        </form>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl border-2 border-blue-400 p-6 w-80">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">웹 페이지 메시지</h3>
              <button
                onClick={() => {
                  setShowPopup(false)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-gray-700">로그인 되었습니다. 환영합니다. :)</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowPopup(false)
                }}
                className="px-4 py-2 bg-white border-2 border-blue-400 text-blue-600 rounded hover:bg-blue-50 transition-colors font-medium"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
