'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Wallet, CreditCard, LogOut, User, Store, LayoutDashboard } from 'lucide-react'

export default function Header() {
  const { data: session, status } = useSession()
  const userRoles = session?.user?.roles ?? []

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              Next Pay
            </Link>
          </div>

          <nav className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-sm text-gray-500">로딩 중...</div>
            ) : status === 'authenticated' ? (
              <>
                <div className="flex items-center space-x-2 mr-4">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>

                {userRoles.includes('CUSTOMER') && (
                  <>
                    <Link
                      href="/customer/wallet"
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>지갑</span>
                    </Link>
                    <Link
                      href="/customer/payment-methods"
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
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
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Store className="w-4 h-4" />
                      <span>가맹점</span>
                    </Link>
                    <Link
                      href="/merchant/settlements"
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>정산</span>
                    </Link>
                  </>
                )}

                {userRoles.includes('ADMIN') && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>관리자</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
