import Link from 'next/link'

export default function CustomerPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">고객 대시보드</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/customer/wallet"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-lg font-semibold mb-2">페이 포인트</h3>
          <p className="text-gray-600">포인트 충전 및 내역 관리</p>
        </Link>
        <Link
          href="/customer/payments"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-lg font-semibold mb-2">간편결제</h3>
          <p className="text-gray-600">원클릭 결제 수행</p>
        </Link>
        <Link
          href="/customer/payment-methods"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-lg font-semibold mb-2">결제 수단</h3>
          <p className="text-gray-600">카드 및 계좌 관리</p>
        </Link>
      </div>
    </div>
  )
}
