'use client'

import { PortalHeading } from '@/app/_portal/portal'
import styles from '@/app/_portal/portal.module.css'

import { useState } from 'react'
import { QrCode, Scan } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Toast } from '@/components/ui/toast'
import { Confetti } from '@/components/ui/confetti'

export default function QRPaymentPage() {
  const [amount, setAmount] = useState('')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const generateQRCode = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/merchant/qr-code?amount=${amount || ''}`)
      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
      } else {
        const data = await response.json()
        setToast({ message: data.error || 'QR 코드 생성 실패', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'QR 코드 생성 중 오류가 발생했습니다.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const simulatePayment = () => {
    setShowPaymentDialog(true)
  }

  const completePayment = () => {
    setShowPaymentDialog(false)
    setPaymentSuccess(true)
    setQrCode(null)
    setAmount('')
    setToast({ message: '결제가 완료되었습니다!', type: 'success' })
  }

  return (
    <div className={styles.stack}>
      <PortalHeading title="QR 코드 결제" description="결제 금액을 설정하고 고객에게 보여줄 QR 코드를 만드세요." />
      <div className={styles.toast} aria-live="polite">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

      </div>

      <Confetti trigger={paymentSuccess} onComplete={() => setPaymentSuccess(false)} />

      <div className={styles.surface}>
        <div className={styles.groupTitle}>
          <span className={styles.icon}><QrCode size={22} aria-hidden="true" /></span>
          <h2 className="text-2xl font-bold text-gray-900">QR 코드 만들기</h2>
        </div>

        <div className={styles.sectionContent}>
          <div className={styles.field}>
            <Input
              label="결제 금액 (선택)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="미입력 시 고객이 직접 입력"
            />
          </div>

          <Button
            onClick={generateQRCode}
            loading={loading}
            className={styles.primaryButton}
          >
            {loading ? '생성 중...' : 'QR 코드 생성'}
          </Button>
        </div>
      </div>

      {qrCode && (
        <div className={styles.surface}>
          <div className={styles.toolbar}>
            <h3 className="text-lg font-semibold text-gray-900">결제용 QR 코드</h3>
            <Button className={styles.button}
              variant="ghost"
              size="sm"
              onClick={() => setQrCode(null)}
            >
              닫기
            </Button>
          </div>

          <div className={styles.sectionContent}>
            <div className={styles.qrFrame}>
              <img src={qrCode} alt="고객 결제용 QR 코드" className={styles.qrImage} />
            </div>

            <div className={styles.actions}>
              <Button
                onClick={simulatePayment}
                className={styles.primaryButton}
              >
                <Scan className="w-4 h-4" />
                <span>고객이 스캔 (시뮬레이션)</span>
              </Button>
            </div>

            <div className={styles.muted}>
              <p>고객이 이 QR 코드를 스캔하여 결제를 진행합니다</p>
              <p className="mt-1">고객 스캔을 시뮬레이션할 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.surface}>
        <div className={styles.groupTitle}>
          <div className={styles.icon}>
            <Scan className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">QR 결제 안내</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 고객이 QR 코드를 스캔하면 결제 화면이 열립니다</li>
              <li>• 금액을 미리 설정하거나 고객이 직접 입력할 수 있습니다</li>
              <li>• 결제가 완료되면 알림이 표시됩니다</li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.overlay}>
        <Dialog
          isOpen={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          title="결제 확인"
          size="sm"
        >
          <div className="space-y-4">
            <div className={styles.dialogText}>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 mb-2">
                결제 금액: <span className="font-bold text-gray-900">{amount || '사용자 입력'}원</span>
              </p>
              <p className="text-sm text-gray-500">고객이 결제를 완료했습니다</p>
            </div>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={() => setShowPaymentDialog(false)}
                className={styles.button}
              >
                취소
              </Button>
              <Button
                onClick={completePayment}
                className={styles.primaryButton}
              >
                결제 승인
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  )
}
