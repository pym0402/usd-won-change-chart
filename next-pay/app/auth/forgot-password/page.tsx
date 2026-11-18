'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setTempPassword('')
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

      if (data.tempPassword) {
        setTempPassword(data.tempPassword)
      }
    } catch (error) {
      setError('비밀번호 재설정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            비밀번호 찾기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            가입하신 이메일을 입력하시면 임시 비밀번호를 발급해드립니다.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm shadow-md">
              {error}
            </div>
          )}

          {tempPassword ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              <p className="font-medium">임시 비밀번호 발급 완료!</p>
              <p className="text-sm mt-2">
                임시 비밀번호: <span className="font-bold text-lg bg-white px-3 py-1 rounded">{tempPassword}</span>
              </p>
              <p className="text-sm mt-2 text-green-600">
                위 비밀번호로 로그인 후 비밀번호를 변경해주세요.
              </p>
              <div className="mt-4 space-y-2">
                <Link
                  href="/auth/signin"
                  className="block text-green-700 hover:text-green-900 font-medium"
                >
                  로그인 페이지로 이동
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    이메일 주소
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="이메일 주소"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '발급 중...' : '임시 비밀번호 발급'}
                </button>
              </div>

              <div className="text-center space-y-2">
                <Link
                  href="/auth/signin"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  로그인으로 돌아가기
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
