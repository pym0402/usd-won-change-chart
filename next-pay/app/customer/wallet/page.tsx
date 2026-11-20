'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, Gift, List, Plus, RotateCcw, Wallet } from 'lucide-react'
import { Toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/ui/confetti'
import styles from '../customer.module.css'

interface Wallet {
  id: string
  userId: string
  balance: number
  createdAt: string
  updatedAt: string
}

interface Transaction {
  id: string
  walletId: string
  type: string
  amount: number
  balanceAfter: number
  description: string
  createdAt: string
}

const charge = { label: '충전', tone: styles.blue, icon: Plus, sign: '+' }
const use = { label: '결제 사용', tone: styles.red, icon: ArrowUpRight, sign: '−' }
const reward = { label: '리워드 적립', tone: styles.mint, icon: Gift, sign: '+' }

const transactionStyles = new Map([
  ['CHARGE', charge],
  ['USE', use],
  ['PAYMENT', use],
  ['EARN', reward],
  ['REWARD', reward],
  ['REFUND', { label: '환불', tone: styles.violet, icon: RotateCcw, sign: '+' }],
  ['TRANSFER_IN', { label: '송금 받음', tone: styles.blue, icon: ArrowDownLeft, sign: '+' }],
  ['TRANSFER_OUT', { label: '송금 보냄', tone: styles.neutral, icon: ArrowUpRight, sign: '−' }],
])

export default function WalletPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [chargeAmount, setChargeAmount] = useState('')
  const [chargeDescription, setChargeDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    fetchWallet()
    fetchTransactions()
  }, [])

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const data = await response.json()
        setWallet(data)
      }
    } catch (err) {
      console.error('지갑 조회 오류:', err)
    }
  }

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/wallet/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (err) {
      console.error('거래 내역 조회 오류:', err)
    }
  }

  const handleCharge = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const amount = parseInt(chargeAmount)
      if (!amount || amount <= 0) {
        setToast({ message: '유효한 충전 금액을 입력해주세요.', type: 'error' })
        setLoading(false)
        return
      }

      const response = await fetch('/api/wallet/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description: chargeDescription || '포인트 충전',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setToast({ message: data.message, type: 'success' })
        setShowConfetti(true)
        setChargeAmount('')
        setChargeDescription('')
        fetchWallet()
        fetchTransactions()
      } else {
        const data = await response.json()
        setToast({ message: data.error || '충전 중 오류가 발생했습니다.', type: 'error' })
      }
    } catch (err) {
      setToast({ message: '충전 중 오류가 발생했습니다.', type: 'error' })
    } finally {
      setLoading(false)
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
        <h1>내 지갑</h1>
        <p>포인트를 충전하고 잔액과 거래 내역을 확인하세요.</p>
      </header>

      <div className={styles.walletGrid}>
        <section className={styles.balanceCard} aria-labelledby="balance-heading">
          <span className={styles.balanceIcon}><Wallet size={26} aria-hidden="true" /></span>
          <h2 id="balance-heading">현재 포인트 잔액</h2>
          {wallet ? (
            <p className={styles.balanceAmount}>{wallet.balance.toLocaleString()} <span>P</span></p>
          ) : (
            <p className={styles.loadingBalance}>잔액을 불러오는 중…</p>
          )}
        </section>

        <section className={styles.card} aria-labelledby="charge-heading">
          <div className={styles.cardHeading}>
            <span className={styles.icon}><Plus size={22} aria-hidden="true" /></span>
            <h2 id="charge-heading">포인트 충전</h2>
          </div>
          <form onSubmit={handleCharge} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="amount">충전 금액</label>
              <input
                type="number"
                id="amount"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                placeholder="충전할 포인트 금액"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="description">설명 <span>(선택)</span></label>
              <input
                type="text"
                id="description"
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                placeholder="충전 설명"
              />
            </div>
            <Button type="submit" loading={loading} className={styles.primary}>
              {loading ? '충전 중...' : '충전하기'}
            </Button>
          </form>
        </section>
      </div>

      <section className={styles.card} aria-labelledby="transactions-heading">
        <div className={styles.cardHeading}>
          <span className={styles.icon}><List size={22} aria-hidden="true" /></span>
          <h2 id="transactions-heading">거래 내역</h2>
        </div>
        {transactions.length > 0 ? (
          <ul className={styles.history}>
            {transactions.map((transaction) => {
              const presentation = transactionStyles.get(transaction.type)
              const { label, tone, icon: Icon, sign } = presentation ?? {
                label: transaction.type,
                tone: styles.neutral,
                icon: List,
                sign: transaction.amount < 0 ? '−' : '+',
              }

              return (
                <li key={transaction.id} className={styles.historyRow}>
                  <div className={styles.rowIdentity}>
                    <span className={`${styles.rowIcon} ${tone}`}><Icon size={20} aria-hidden="true" /></span>
                    <div className={styles.rowCopy}>
                      <div className={styles.rowTitle}>
                        <span className={`${styles.badge} ${tone}`}>{label}</span>
                        {transaction.description && transaction.description !== label && (
                          <p>{transaction.description}</p>
                        )}
                      </div>
                      <time dateTime={transaction.createdAt}>{new Date(transaction.createdAt).toLocaleString('ko-KR')}</time>
                    </div>
                  </div>
                  <div className={styles.rowValues}>
                    <strong className={tone}>{sign}{Math.abs(transaction.amount).toLocaleString()} P</strong>
                    <span>거래 후 잔액 {transaction.balanceAfter.toLocaleString()} P</span>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className={styles.empty}>거래 내역이 없습니다.</p>
        )}
      </section>
    </div>
  )
}
