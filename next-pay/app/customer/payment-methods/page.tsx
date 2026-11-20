'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, CreditCard, Landmark, Plus } from 'lucide-react'
import styles from '../customer.module.css'

interface PaymentMethod {
  id: string
  userId: string
  type: string
  paymentMethodId?: string
  last4?: string | null
  bankName?: string
  bankAccount?: string
  isDefault: boolean
  createdAt: string
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [type, setType] = useState<'CARD' | 'BANK_ACCOUNT'>('CARD')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPaymentMethods()
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

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const body: any = { type, isDefault }

      if (type === 'CARD') {
        if (!paymentMethodId) {
          setError('카드 결제 수단 등록을 위해 paymentMethodId가 필요합니다.')
          setLoading(false)
          return
        }
        body.paymentMethodId = paymentMethodId
      } else if (type === 'BANK_ACCOUNT') {
        if (!bankName || !bankAccount) {
          setError('계좌 결제 수단 등록을 위해 bankName과 bankAccount가 필요합니다.')
          setLoading(false)
          return
        }
        body.bankName = bankName
        body.bankAccount = bankAccount
      }

      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setSuccess('결제 수단이 등록되었습니다.')
        setPaymentMethodId('')
        setBankName('')
        setBankAccount('')
        setIsDefault(false)
        fetchPaymentMethods()
      } else {
        const data = await response.json()
        setError(data.error || '결제 수단 등록 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('결제 수단 등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}/default`, {
        method: 'POST',
      })

      if (response.ok) {
        setSuccess('기본 결제 수단이 변경되었습니다.')
        fetchPaymentMethods()
      } else {
        const data = await response.json()
        setError(data.error || '기본 결제 수단 변경 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('기본 결제 수단 변경 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 결제 수단을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('결제 수단이 삭제되었습니다.')
        fetchPaymentMethods()
      } else {
        const data = await response.json()
        setError(data.error || '결제 수단 삭제 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setError('결제 수단 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className={styles.stack}>
      <header className={styles.pageHeader}>
        <h1>결제 수단 관리</h1>
        <p>카드와 계좌를 등록하고 기본 결제 수단을 설정하세요.</p>
      </header>
      <div className={styles.paymentGrid}>
        <section className={styles.card} aria-labelledby="add-method">
          <div className={styles.cardHeading}>
            <span className={styles.icon}><Plus size={22} aria-hidden="true" /></span>
            <h2 id="add-method">결제 수단 등록</h2>
          </div>
          <form onSubmit={handleAddPaymentMethod} className={styles.form}>
            {error && <p role="alert" className={styles.formError}>{error}</p>}
            {success && <p role="status" className={styles.formSuccess}>{success}</p>}
            <div className={styles.field}>
              <label htmlFor="type">결제 수단 유형</label>
              <div className={styles.select}>
                <select id="type" value={type} onChange={(e) => setType(e.target.value as 'CARD' | 'BANK_ACCOUNT')}>
                  <option value="CARD">카드</option>
                  <option value="BANK_ACCOUNT">계좌</option>
                </select>
                <ChevronDown size={18} aria-hidden="true" />
              </div>
            </div>
            {type === 'CARD' && (
              <div className={styles.field}>
                <label htmlFor="paymentMethodId">카드 ID</label>
                <input type="text" id="paymentMethodId" value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)} placeholder="카드 결제 수단 ID" required />
              </div>
            )}
            {type === 'BANK_ACCOUNT' && (
              <>
                <div className={styles.field}>
                  <label htmlFor="bankName">은행명</label>
                  <input type="text" id="bankName" value={bankName}
                    onChange={(e) => setBankName(e.target.value)} placeholder="예: 신한은행" required />
                </div>
                <div className={styles.field}>
                  <label htmlFor="bankAccount">계좌번호</label>
                  <input type="text" id="bankAccount" value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)} placeholder="계좌번호" required />
                </div>
              </>
            )}
            <label className={styles.checkField}>
              <input type="checkbox" id="isDefault" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
              기본 결제 수단으로 설정
            </label>
            <button type="submit" disabled={loading} className={styles.primary}>
              {loading ? '등록 중...' : '결제 수단 등록'}
            </button>
          </form>
        </section>
        <section className={styles.card} aria-labelledby="saved-methods">
          <div className={styles.cardHeading}>
            <span className={styles.icon}><CreditCard size={22} aria-hidden="true" /></span>
            <h2 id="saved-methods">등록된 결제 수단</h2>
          </div>
          {paymentMethods.length > 0 ? (
            <ul className={styles.history}>
              {paymentMethods.map((method) => (
                <li key={method.id} className={styles.historyRow}>
                  <div className={styles.rowIdentity}>
                    <span className={`${styles.rowIcon} ${styles.blue}`}>
                      {method.type === 'CARD' ? <CreditCard size={20} aria-hidden="true" /> : <Landmark size={20} aria-hidden="true" />}
                    </span>
                    <div className={styles.rowCopy}>
                      <div className={styles.rowTitle}>
                        <p>{method.type === 'CARD' ? '카드' : '계좌'}</p>
                        {method.isDefault && <span className={`${styles.badge} ${styles.blue}`}>기본</span>}
                      </div>
                      <span>{method.type === 'CARD'
                        ? (method.last4 ? `끝자리 ${method.last4}` : method.paymentMethodId)
                        : `${method.bankName} · ${method.bankAccount}`}</span>
                      <time dateTime={method.createdAt}>{new Date(method.createdAt).toLocaleString('ko-KR')}</time>
                    </div>
                  </div>
                  <div className={styles.rowActions}>
                    {!method.isDefault && (
                      <button type="button" className={styles.action} onClick={() => handleSetDefault(method.id)}>기본 설정</button>
                    )}
                    <button type="button" className={`${styles.action} ${styles.danger}`} onClick={() => handleDelete(method.id)}>삭제</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className={styles.empty}>등록된 결제 수단이 없습니다.</p>}
        </section>
      </div>
    </div>
  )
}
