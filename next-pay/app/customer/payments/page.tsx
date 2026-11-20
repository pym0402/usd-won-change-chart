'use client'

import { useState, useEffect } from 'react'
import { usePortalQuery } from '@/app/_portal/use-portal-query'
import { ChevronDown, CircleAlert, CircleCheck, CircleX, Clock, CreditCard, Gift, List, ReceiptText } from 'lucide-react'
import { Toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/ui/confetti'
import { StripePaymentModal } from '@/components/ui/stripe-payment-modal'
import styles from '../customer.module.css'

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

const pending = { label: '대기 중', tone: styles.amber, icon: Clock }
const completed = { label: '승인됨', tone: styles.mint, icon: CircleCheck }
const refunded = { label: '환불됨', tone: styles.violet, icon: CircleAlert }

const paymentStatuses = new Map([
  ['PENDING', pending],
  ['PROCESSING', { ...pending, label: '처리 중' }],
  ['CONFIRMED', completed],
  ['COMPLETED', completed],
  ['CANCELLED', { label: '취소됨', tone: styles.red, icon: CircleX }],
  ['FAILED', { label: '실패', tone: styles.red, icon: CircleX }],
  ['REFUNDED', refunded],
  ['PARTIALLY_REFUNDED', { ...refunded, label: '부분 환불' }],
])

function PaymentStatus({ status }: { status: string }) {
  const { label, tone, icon: Icon } = paymentStatuses.get(status) ?? {
    label: status,
    tone: styles.neutral,
    icon: CircleAlert,
  }

  return <span className={`${styles.badge} ${tone}`}><Icon size={15} aria-hidden="true" />{label}</span>
}

export default function PaymentsPage() {
  const { result: merchantResult, refresh: refreshMerchants } = usePortalQuery<Array<{ id: string; businessName: string }>>('/api/merchants/approved')
  const merchants = merchantResult.status === 'ready' ? merchantResult.data : []
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
  const [recentPaymentResult, setRecentPaymentResult] = useState<Payment | null>(null)
  const [currentWalletBalance, setCurrentWalletBalance] = useState<number | null>(null)

  useEffect(() => {
    fetchPaymentMethods()
    fetchPayments()
    fetchWalletBalance()
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
      const response = await fetch('/api/payments?scope=customer')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || data)
      }
    } catch (err) {
      console.error('결제 내역 조회 오류:', err)
    }
  }

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const data = await response.json()
        setCurrentWalletBalance(data.balance)
      }
    } catch (err) {
      console.error('지갑 잔액 조회 오류:', err)
    }
  }

  const handleCreatePaymentIntent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const amt = parseInt(amount)
      const ptAmt = parseInt(pointAmount)

      if (!merchants.some((merchant) => merchant.id === merchantId) || !amt || amt <= 0) {
        setToast({ message: '가맹점을 선택하고 결제 금액을 입력해 주세요.', type: 'error' })
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
        if (data.blocked) {
          setToast({ message: '이 결제는 이상 거래 검토로 차단되었습니다.', type: 'error' })
          fetchPayments()
          return
        }
        // Stripe 모달 열기
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
          setCurrentPaymentId(data.payment.id)
          setStripeModalOpen(true)
        } else {
          // 등록된 결제 수단이 있거나 포인트만 사용한 경우 - 자동으로 결제 승인 진행
          if (selectedPaymentMethod || data.payment.cardAmount === 0) {
            await handleConfirmPayment(data.payment.id)
          } else {
            setToast({ message: 'Payment Intent가 생성되었습니다.', type: 'success' })
            setMerchantId('')
            setAmount('')
            setPointAmount('0')
            setSelectedPaymentMethod('')
            fetchPayments()
          }
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

        // 최근 결제 결과 저장
        setRecentPaymentResult(data)

        // 지갑 잔액 갱신
        fetchWalletBalance()

        // 포인트 적립 메시지와 Confetti 효과
        setToast({
          message: `결제가 승인되었습니다! 🎉 ${totalAmount.toLocaleString()}원 결제로 ${earnedPoints.toLocaleString()}P가 적립되었습니다.`,
          type: 'success'
        })
        setShowConfetti(true)
        setMerchantId('')
        setAmount('')
        setPointAmount('0')
        setSelectedPaymentMethod('')
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

  return (
    <div className={styles.stack}>
      <div className={styles.notice} aria-live="polite">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <header className={styles.pageHeader}>
        <h1>결제 테스트</h1>
        <p>카드와 포인트로 결제를 테스트하고 승인 결과를 확인하세요.</p>
      </header>

      <div className={styles.paymentGrid}>
        <section className={styles.card} aria-labelledby="payment-form-heading">
          <div className={styles.cardHeading}>
            <span className={styles.icon}><CreditCard size={22} aria-hidden="true" /></span>
            <h2 id="payment-form-heading">결제 정보</h2>
          </div>
          <form onSubmit={handleCreatePaymentIntent} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="merchantId">가맹점</label>
              <div className={styles.select}>
                <select id="merchantId" value={merchantId} onChange={(e) => setMerchantId(e.target.value)}
                  disabled={merchants.length === 0} required>
                  <option value="">가맹점을 선택하세요</option>
                  {merchants.map(({ id, businessName }) => (
                    <option key={id} value={id}>{businessName} ({id.slice(0, 6)}…{id.slice(-4)})</option>
                  ))}
                </select>
                <ChevronDown size={18} aria-hidden="true" />
              </div>
              {merchantResult.status === 'loading' && <p className={styles.formHint} role="status">가맹점을 불러오는 중입니다.</p>}
              {merchantResult.status === 'error' && (
                <div className={styles.formHint} role="alert">
                  가맹점을 불러오지 못했습니다. <button type="button" className={styles.retry} onClick={refreshMerchants}>다시 시도</button>
                </div>
              )}
              {merchantResult.status === 'ready' && merchants.length === 0 && (
                <p className={styles.formHint} role="status">아직 승인된 가맹점이 없습니다.</p>
              )}
            </div>

            <div className={styles.fieldsGrid}>
              <div className={styles.field}>
                <label htmlFor="amount">결제 금액 (원)</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="결제 금액"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="pointAmount">포인트 사용 금액 <span>(선택)</span></label>
                <input
                  type="number"
                  id="pointAmount"
                  value={pointAmount}
                  onChange={(e) => setPointAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {amount && parseInt(amount) > 0 && (
              <p className={styles.rewardNote}>
                <Gift size={18} aria-hidden="true" />
                <span>예상 적립 포인트 <strong>{calculateEarnedPoints(amount).toLocaleString()} P</strong> (1%)</span>
              </p>
            )}

            <div className={styles.field}>
              <label htmlFor="paymentMethod">결제 수단 <span>(선택)</span></label>
              <div className={styles.select}>
                <select
                  id="paymentMethod"
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                >
                  <option value="">새 카드로 결제 (Stripe)</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.type === 'CARD'
                        ? `카드: ${method.paymentMethodId}${method.isDefault ? ' (기본)' : ''}`
                        : `계좌: ${method.bankName} - ${method.bankAccount}${method.isDefault ? ' (기본)' : ''}`}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} aria-hidden="true" />
              </div>
            </div>

            <Button type="submit" loading={loading} disabled={merchants.length === 0} className={styles.primary}>
              {loading ? '생성 중...' : '결제하기'}
            </Button>
          </form>
        </section>

        <section className={`${styles.card} ${styles.result}`} aria-labelledby="recent-payment-heading" aria-live="polite">
          <div className={styles.cardHeading}>
            <span className={styles.icon}><ReceiptText size={22} aria-hidden="true" /></span>
            <h2 id="recent-payment-heading">최근 결제 결과</h2>
          </div>

          {recentPaymentResult ? (
            <>
              <div className={styles.resultAmount}>
                <div>
                  <p>총 결제 금액</p>
                  <strong>{recentPaymentResult.amount.toLocaleString()}원</strong>
                </div>
                <PaymentStatus status={recentPaymentResult.status} />
              </div>
              <dl className={styles.receiptDetails}>
                <div>
                  <dt>결제 ID</dt>
                  <dd>{recentPaymentResult.id}</dd>
                </div>
                <div>
                  <dt>사용 포인트</dt>
                  <dd>{recentPaymentResult.pointAmount.toLocaleString()} P</dd>
                </div>
                <div>
                  <dt>남은 지갑 잔액</dt>
                  <dd>{currentWalletBalance?.toLocaleString() || '0'} P</dd>
                </div>
                <div>
                  <dt>적립 리워드 (1%)</dt>
                  <dd className={styles.rewardValue}>{Math.floor(recentPaymentResult.amount * 0.01).toLocaleString()} P</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className={styles.empty}>결제 승인 결과가 여기에 표시됩니다.</p>
          )}
        </section>
      </div>

      <section className={styles.card} aria-labelledby="payments-heading">
        <div className={styles.cardHeading}>
          <span className={styles.icon}><List size={22} aria-hidden="true" /></span>
          <h2 id="payments-heading">결제 내역</h2>
        </div>

        {payments.length > 0 ? (
          <ul className={styles.history}>
            {payments.map((payment) => (
              <li key={payment.id} className={`${styles.historyRow} ${styles.paymentRow}`}>
                <div className={styles.rowIdentity}>
                  <span className={`${styles.rowIcon} ${styles.blue}`}><CreditCard size={20} aria-hidden="true" /></span>
                  <div className={styles.rowCopy}>
                    <div className={styles.rowTitle}>
                      <p title={payment.id}>결제 {payment.id.slice(0, 12)}...</p>
                      <PaymentStatus status={payment.status} />
                    </div>
                    <span>가맹점 {payment.merchantId}</span>
                    <time dateTime={payment.createdAt}>{new Date(payment.createdAt).toLocaleString('ko-KR')}</time>
                  </div>
                </div>
                <div className={styles.rowValues}>
                  <strong>{payment.amount.toLocaleString()}원</strong>
                  <span>사용 포인트 {payment.pointAmount.toLocaleString()} P</span>
                </div>
                {(payment.status === 'PENDING' || payment.status === 'CONFIRMED') && (
                  <div className={styles.rowActions}>
                    {payment.status === 'PENDING' && (
                      <Button variant="secondary" size="sm" className={styles.action} onClick={() => handleConfirmPayment(payment.id)}>
                        승인
                      </Button>
                    )}
                    <Button variant="danger" size="sm" className={`${styles.action} ${styles.danger}`} onClick={() => handleCancelPayment(payment.id)}>
                      취소
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>결제 내역이 없습니다.</p>
        )}
      </section>

      <div className={styles.checkout}>
        <StripePaymentModal
          isOpen={stripeModalOpen}
          onClose={() => setStripeModalOpen(false)}
          clientSecret={clientSecret}
          amount={parseInt(amount) || 0}
          onSuccess={handleStripePaymentSuccess}
          onError={(error) => setToast({ message: error, type: 'error' })}
        />
      </div>
    </div>
  )
}
