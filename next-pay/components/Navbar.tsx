'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Wallet, CreditCard, LogOut, User, Store, LayoutDashboard, Shield, Zap } from 'lucide-react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const userRoles = (session?.user as any)?.roles || []

  // 디버깅용
  console.log('[Navbar] 세션 상태:', { status, session, userRoles })

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Next Pay
                </span>
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">로딩 중...</span>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  const isAuthenticated = status === 'authenticated' && session?.user

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Next Pay
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 mr-4 px-3 py-2 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 font-medium">
                    {session.user?.name || session.user?.email}
                  </span>
                  {userRoles.length > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({userRoles.join(', ')})
                    </span>
                  )}
                </div>

                {userRoles.includes('CUSTOMER') && (
                  <>
                    <Link
                      href="/customer/wallet"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-sm font-medium"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>지갑</span>
                    </Link>
                    <Link
                      href="/customer/payment-methods"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-sm font-medium"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>결제 수단</span>
                    </Link>
                  </>
                )}

                {userRoles.includes('MERCHANT') && (
                  <>
                    <Link
                      href="/merchant"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-sm font-medium"
                    >
                      <Store className="w-4 h-4" />
                      <span>가맹점</span>
                    </Link>
                    <Link
                      href="/merchant/settlements"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-sm font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>정산</span>
                    </Link>
                  </>
                )}

                {userRoles.includes('ADMIN') && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-sm font-medium"
                  >
                    <Shield className="w-4 h-4" />
                    <span>관리자</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
