'use client'

import { useState } from 'react'
import { Send, Gift } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { Confetti } from '@/components/ui/confetti'

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
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Confetti trigger={showSuccess} onComplete={() => {}} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Send className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">포인트 송금</h2>
        </div>

        <form onSubmit={handleTransfer} className="space-y-6">
          <Input
            label="수신자 이메일"
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="example@email.com"
            required
          />

          <Input
            label="송금 금액"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="1"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메시지 (선택)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
              placeholder="포인트 선물합니다."
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            {loading ? '송금 중...' : '송금하기'}
          </Button>
        </form>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-start space-x-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Gift className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">선물하기 팁</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 친구에게 포인트를 보내 특별한 선물을 해보세요</li>
              <li>• 이메일로 수신자를 검색할 수 있습니다</li>
              <li>• 메시지를 남겨 마음을 전하세요</li>
            </ul>
          </div>
        </div>
      </div>

      <Dialog
        isOpen={showSuccess}
        onClose={handleCloseSuccess}
        title="송금 완료!"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">{successData?.recipientName}</span>님에게
            <span className="font-semibold text-gray-900">{amount}P</span>를 송금했습니다.
          </p>
          <Button onClick={handleCloseSuccess} className="w-full">
            확인
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
