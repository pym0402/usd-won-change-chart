'use client'

import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, XCircle, AlertCircle, Gift } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/ui/confetti'
import { StripePaymentModal } from '@/components/ui/stripe-payment-modal'

interface PaymentMethod {
  id: string
  type: string
  paymentMethodId?: string
  bankName?: string
  bankAccount?: string
  isDefault: boolean
}

interface Payment {
  id: string
  merchantId: string
  customerId: string
  amount: number
  pointAmount: number
  paymentMethodId?: string
  status: string
  createdAt: string
}

export default function PaymentsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [merchantId, setMerchantId] = useState('')
  const [amount, setAmount] = useState('')
  const [pointAmount, setPointAmount] = useState('0')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [stripeModalOpen, setStripeModalOpen] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [currentPaymentId, setCurrentPaymentId] = useState('')

  useEffect(() => {
    fetchPaymentMethods()
    fetchPayments()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data)
      }
    } catch (err) {
      console.error('결제 수단 조회 오류:', err)
    }
  }

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || data)
      }
    } catch (err) {
      console.error('결제 내역 조회 오류:', err)
    }
  }

  const handleCreatePaymentIntent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const amt = parseInt(amount)
      const ptAmt = parseInt(pointAmount)

      if (!merchantId || !amt || amt <= 0) {
        setToast({ message: '가맹점 ID와 결제 금액을 입력해주세요.', type: 'error' })
        setLoading(false)
        return
      }

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId,
          amount: amt,
          pointAmount: ptAmt,
          paymentMethodId: selectedPaymentMethod || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Stripe 모달 열기
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
          setCurrentPaymentId(data.payment.id)
          setStripeModalOpen(true)
        } else {
          // 포인트만 사용한 경우
          setToast({ message: 'Payment Intent가 생성되었습니다.', type: 'success' })
          setMerchantId('')
          setAmount('')
          setPointAmount('0')
          setSelectedPaymentMethod('')
          fetchPayments()
        }
      } else {
        const data = await response.json()
        setToast({ message: data.error || 'Payment Intent 생성 중 오류가 발생했습니다.', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Payment Intent 생성 중 오류가 발생했습니다.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const calculateEarnedPoints = (amount: string) => {
    const amt = parseInt(amount) || 0
    return Math.floor(amt * 0.01)
  }

  const handleConfirmPayment = async (paymentId: string) => {
    setLoading(true)

    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          paymentMethodId: selectedPaymentMethod || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const earnedPoints = data.pointAmount ? Math.floor(data.pointAmount * 0.01) : 0
        const totalAmount = data.amount || 0

        // 포인트 적립 메시지와 Confetti 효과
        setToast({
          message: `결제가 승인되었습니다! 🎉 ${totalAmount.toLocaleString()}원 결제로 ${earnedPoints.toLocaleString()}P가 적립되었습니다.`,
          type: 'success'
        })
        setShowConfetti(true)
        fetchPayments()
      } else {
        const data = await response.json()
        setToast({ message: data.error || '결제 승인 중 오류가 발생했습니다.', type: 'error' })
      }
    } catch (err) {
      setToast({ message: '결제 승인 중 오류가 발생했습니다.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelPayment = async (paymentId: string) => {
    if (!confirm('정말 이 결제를 취소하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/payments/${paymentId}/cancel`, {
        method: 'POST',
      })

      if (response.ok) {
        setToast({ message: '결제가 취소되었습니다.', type: 'success' })
        fetchPayments()
      } else {
        const data = await response.json()
        setToast({ message: data.error || '결제 취소 중 오류가 발생했습니다.', type: 'error' })
      }
    } catch (err) {
      setToast({ message: '결제 취소 중 오류가 발생했습니다.', type: 'error' })
    }
  }

  const handleStripePaymentSuccess = async () => {
    if (currentPaymentId) {
      const earnedPoints = calculateEarnedPoints(amount)
      const totalAmount = parseInt(amount) || 0

      setToast({
        message: `결제가 완료되었습니다! 🎉 ${totalAmount.toLocaleString()}원 결제로 ${earnedPoints.toLocaleString()}P가 적립되었습니다.`,
        type: 'success'
      })
      setShowConfetti(true)
      setMerchantId('')
      setAmount('')
      setPointAmount('0')
      setSelectedPaymentMethod('')
      fetchPayments()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700'
      case 'CANCELLED':
        return 'bg-red-100 text-red-700'
      case 'FAILED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <AlertCircle className="w-4 h-4" />
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED':
      case 'FAILED':
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '대기중'
      case 'CONFIRMED':
        return '승인됨'
      case 'CANCELLED':
        return '취소됨'
      case 'FAILED':
        return '실패'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">결제 테스트</h2>
        </div>

        <form onSubmit={handleCreatePaymentIntent} className="space-y-4">
          <div>
            <label htmlFor="merchantId" className="block text-sm font-medium text-gray-700 mb-2">
              가맹점 ID
            </label>
            <input
              type="text"
              id="merchantId"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="가맹점 ID (예: merchant_123)"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              결제 금액
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="결제 금액"
              required
            />
            {amount && parseInt(amount) > 0 && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                <Gift className="w-4 h-4" />
                <span>예상 적립 포인트: {calculateEarnedPoints(amount).toLocaleString()}P (1%)</span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="pointAmount" className="block text-sm font-medium text-gray-700 mb-2">
              포인트 사용 금액 (선택)
            </label>
            <input
              type="number"
              id="pointAmount"
              value={pointAmount}
              onChange={(e) => setPointAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
              결제 수단 (선택)
            </label>
            <select
              id="paymentMethod"
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">선택 안함 (Payment Intent 생성만)</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.type === 'CARD'
                    ? `카드: ${method.paymentMethodId}${method.isDefault ? ' (기본)' : ''}`
                    : `계좌: ${method.bankName} - ${method.bankAccount}${method.isDefault ? ' (기본)' : ''}`}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            {loading ? '생성 중...' : '결제하기'}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">결제 내역</h3>
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    결제 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    가맹점 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    포인트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {payment.id.slice(0, 12)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.merchantId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {payment.amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.pointAmount.toLocaleString()}P
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span>{getStatusText(payment.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.createdAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {payment.status === 'PENDING' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleConfirmPayment(payment.id)}
                          >
                            승인
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancelPayment(payment.id)}
                          >
                            취소
                          </Button>
                        </>
                      )}
                      {payment.status === 'CONFIRMED' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelPayment(payment.id)}
                        >
                          취소
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">결제 내역이 없습니다.</p>
          </div>
        )}
      </div>

      <StripePaymentModal
        isOpen={stripeModalOpen}
        onClose={() => setStripeModalOpen(false)}
        clientSecret={clientSecret}
        amount={parseInt(amount) || 0}
        onSuccess={handleStripePaymentSuccess}
        onError={(error) => setToast({ message: error, type: 'error' })}
      />
    </div>
  )
}
