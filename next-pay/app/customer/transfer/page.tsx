'use client'

import { useState } from 'react'
import { Send, Gift } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { Confetti } from '@/components/ui/confetti'
import styles from '../customer.module.css'

export default function TransferPage() {
  const [recipientEmail, setRecipientEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<{ recipientName: string } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const amt = parseInt(amount)
      if (!recipientEmail || !amt || amt <= 0) {
        setToast({ message: '수신자 이메일과 금액을 입력해주세요.', type: 'error' })
        setLoading(false)
        return
      }

      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail,
          amount: amt,
          message: message || '포인트 선물'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccessData({ recipientName: data.recipientName })
        setShowSuccess(true)
        setRecipientEmail('')
        setAmount('')
        setMessage('')
      } else {
        const data = await response.json()
        setToast({ message: data.error || '송금 중 오류가 발생했습니다.', type: 'error' })
      }
    } catch (err) {
      setToast({ message: '송금 중 오류가 발생했습니다.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
    setSuccessData(null)
  }

  return (
    <div className={styles.stack}>
      <div className={styles.notice} aria-live="polite">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
      <Confetti trigger={showSuccess} onComplete={() => {}} />
      <header className={styles.pageHeader}>
        <h1>송금/선물</h1>
        <p>받는 사람의 이메일로 포인트를 보내세요.</p>
      </header>
      <div className={styles.paymentGrid}>
        <section className={styles.card} aria-labelledby="transfer-heading">
          <div className={styles.cardHeading}>
            <span className={styles.icon}><Send size={22} aria-hidden="true" /></span>
            <h2 id="transfer-heading">포인트 송금</h2>
          </div>
          <form onSubmit={handleTransfer} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="recipientEmail">수신자 이메일</label>
              <input id="recipientEmail" type="email" value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)} placeholder="example@email.com" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="transferAmount">송금 금액 (P)</label>
              <input id="transferAmount" type="number" value={amount}
                onChange={(e) => setAmount(e.target.value)} placeholder="0" min="1" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="transferMessage">메시지 <span>(선택)</span></label>
              <textarea id="transferMessage" value={message} onChange={(e) => setMessage(e.target.value)}
                rows={3} placeholder="포인트 선물합니다." />
            </div>
            <Button type="submit" loading={loading} className={styles.primary}>
              {loading ? '송금 중...' : '송금하기'}
            </Button>
          </form>
        </section>
        <aside className={`${styles.card} ${styles.result}`} aria-labelledby="transfer-tips">
          <div className={styles.cardHeading}>
            <span className={styles.icon}><Gift size={22} aria-hidden="true" /></span>
            <h2 id="transfer-tips">보내기 전에</h2>
          </div>
          <ul className={styles.tips}>
            <li>받는 사람의 Next Pay 가입 이메일을 확인해 주세요.</li>
            <li>포인트와 함께 전달할 메시지를 남길 수 있어요.</li>
          </ul>
        </aside>
      </div>
      <div className={styles.checkout}>
        <Dialog isOpen={showSuccess} onClose={handleCloseSuccess} title="송금 완료" size="sm">
          <div className={styles.dialogBody}>
            <span className={`${styles.rowIcon} ${styles.mint}`}><Send size={22} aria-hidden="true" /></span>
            <p><strong>{successData?.recipientName}</strong>님에게 포인트를 보냈습니다.</p>
            <Button onClick={handleCloseSuccess} className={styles.primary}>확인</Button>
          </div>
        </Dialog>
      </div>
    </div>
  )
}
