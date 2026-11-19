import Link from 'next/link'
import { Wallet, Store, Shield, LogIn, UserPlus } from 'lucide-react'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 pt-16">
      <div className="text-center max-w-5xl mx-auto px-4">
        <h1 className="text-5xl font-bold mb-4 text-indigo-900">Next Pay</h1>
        <p className="text-gray-600 mb-12 text-lg">차세대 통합 간편결제 및 가맹점 정산 원장 플랫폼</p>

        {!session && (
          <div className="flex justify-center gap-4 mb-12">
            <Link
              href="/auth/signin"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 shadow-lg"
            >
              <LogIn className="w-5 h-5" />
              <span>로그인</span>
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium flex items-center gap-2 shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              <span>회원가입</span>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <Link
            href="/customer"
            className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-indigo-300 hover:-translate-y-1"
          >
            <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Wallet className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">고객 페이지</h3>
            <p className="text-gray-600 text-sm leading-relaxed">포인트 충전, 간편결제, 송금 및 리워드 내역 관리</p>
          </Link>

          <Link
            href="/merchant"
            className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-indigo-300 hover:-translate-y-1"
          >
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Store className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">가맹점 페이지</h3>
            <p className="text-gray-600 text-sm leading-relaxed">가변 수수료 정산 내역 확인, QR 결제 및 SDK 연동 가이드</p>
          </Link>

          <Link
            href="/admin"
            className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-indigo-300 hover:-translate-y-1"
          >
            <div className="bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">관리자 페이지</h3>
            <p className="text-gray-600 text-sm leading-relaxed">플랫폼 전체 거래액(GMV) 및 수수료 수익 통계, 가맹점 및 FDS 모니터링</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
