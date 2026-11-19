import Link from 'next/link'
import { Wallet, CreditCard, ArrowRight, Gift } from 'lucide-react'

export default function CustomerPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">고객 대시보드</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/customer/wallet"
          className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-indigo-300 hover:-translate-y-1"
        >
          <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl w-14 h-14 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Wallet className="w-7 h-7 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-800">내 지갑</h3>
          <p className="text-gray-600 text-sm leading-relaxed">포인트 충전 및 내역 관리</p>
        </Link>

        <Link
          href="/customer/payments"
          className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-indigo-300 hover:-translate-y-1"
        >
          <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl w-14 h-14 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <ArrowRight className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-800">간편결제</h3>
          <p className="text-gray-600 text-sm leading-relaxed">원클릭 결제 수행</p>
        </Link>

        <Link
          href="/customer/payment-methods"
          className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-indigo-300 hover:-translate-y-1"
        >
          <div className="bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl w-14 h-14 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <CreditCard className="w-7 h-7 text-violet-600" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-800">결제 수단</h3>
          <p className="text-gray-600 text-sm leading-relaxed">카드 및 계좌 관리</p>
        </Link>

        <Link
          href="/customer/transfer"
          className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-indigo-300 hover:-translate-y-1"
        >
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl w-14 h-14 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Gift className="w-7 h-7 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-800">송금/선물</h3>
          <p className="text-gray-600 text-sm leading-relaxed">회원 간 포인트 송금 및 디지털 선물하기</p>
        </Link>
      </div>
    </div>
  )
}
