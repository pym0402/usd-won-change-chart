import Link from 'next/link'
import { Wallet, CreditCard, LogOut, User, Store, CheckCircle, LogIn, UserPlus } from 'lucide-react'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()
  const userRoles = (session?.user as any)?.roles || []

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 pt-16">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-4 text-indigo-900">Next Pay</h1>
        <p className="text-gray-600 mb-8 text-lg">네이버페이 스타일의 통합 간편결제 및 가맹점 정산 원장 플랫폼</p>

        {session ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {userRoles.includes('CUSTOMER') && (
                <>
                  <Link
                    href="/customer/wallet"
                    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-indigo-100 hover:border-indigo-300"
                  >
                    <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <Wallet className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">내 지갑</h3>
                    <p className="text-gray-600 text-sm">페이 포인트 충전 및 내역 관리</p>
                  </Link>

                  <Link
                    href="/customer/payment-methods"
                    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-indigo-100 hover:border-indigo-300"
                  >
                    <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">결제 수단</h3>
                    <p className="text-gray-600 text-sm">카드 및 계좌 등록 및 관리</p>
                  </Link>

                  <Link
                    href="/customer/payments"
                    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-indigo-100 hover:border-indigo-300"
                  >
                    <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <LogOut className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">결제 내역</h3>
                    <p className="text-gray-600 text-sm">결제 내역 조회 및 관리</p>
                  </Link>
                </>
              )}

              {userRoles.includes('MERCHANT') && (
                <Link
                  href="/merchant"
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-indigo-100 hover:border-indigo-300"
                >
                  <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Store className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">가맹점 대시보드</h3>
                  <p className="text-gray-600 text-sm">매출 및 정산 관리</p>
                </Link>
              )}

              {userRoles.includes('ADMIN') && (
                <Link
                  href="/admin"
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-indigo-100 hover:border-indigo-300"
                >
                  <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">관리자 대시보드</h3>
                  <p className="text-gray-600 text-sm">플랫폼 전체 관리</p>
                </Link>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center space-x-4 mb-8">
              <Link
                href="/auth/signin"
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2 shadow-lg"
              >
                <LogIn className="w-5 h-5" />
                <span>로그인</span>
              </Link>
              <Link
                href="/auth/register"
                className="px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium flex items-center space-x-2 shadow-lg"
              >
                <UserPlus className="w-5 h-5" />
                <span>회원가입</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">내 지갑 (충전)</h3>
                <p className="text-gray-600 text-sm">페이 포인트 충전 및 내역 관리</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">결제 수단 관리</h3>
                <p className="text-gray-600 text-sm">카드 및 계좌 등록 및 관리</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <LogOut className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">결제 테스트</h3>
                <p className="text-gray-600 text-sm">간편결제 테스트 수행</p>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
