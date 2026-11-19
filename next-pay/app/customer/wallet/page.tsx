'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, TrendingUp, Plus } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/ui/skeleton'
import { Confetti } from '@/components/ui/confetti'

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
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium text-blue-100">내 지갑</span>
            </div>
            <p className="text-gray-200 mb-1">현재 포인트 잔액</p>
            {wallet ? (
              <p className="text-5xl font-bold">
                {wallet.balance.toLocaleString()} P
              </p>
            ) : (
              <CardSkeleton />
            )}
          </div>
          <div className="p-4 bg-white/10 rounded-xl">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Plus className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">포인트 충전</h3>
        </div>
        <form onSubmit={handleCharge} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              충전 금액
            </label>
            <input
              type="number"
              id="amount"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="충전할 포인트 금액"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              설명 (선택)
            </label>
            <input
              type="text"
              id="description"
              value={chargeDescription}
              onChange={(e) => setChargeDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="충전 설명"
            />
          </div>
          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            {loading ? '충전 중...' : '충전하기'}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">거래 내역</h3>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    잔액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.createdAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'CHARGE'
                            ? 'bg-green-100 text-green-700'
                            : transaction.type === 'REWARD' || transaction.type === 'EARN'
                            ? 'bg-amber-100 text-amber-700'
                            : transaction.type === 'REFUND'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {transaction.type === 'CHARGE'
                          ? '충전'
                          : transaction.type === 'REWARD' || transaction.type === 'EARN'
                          ? '리워드'
                          : transaction.type === 'REFUND'
                          ? '환불'
                          : transaction.type === 'USE' || transaction.type === 'PAYMENT'
                          ? '결제 사용'
                          : transaction.type}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        transaction.type === 'CHARGE' || transaction.type === 'REWARD' || transaction.type === 'EARN' || transaction.type === 'REFUND'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'CHARGE' || transaction.type === 'REWARD' || transaction.type === 'EARN' || transaction.type === 'REFUND' ? '+' : '-'}
                      {transaction.amount.toLocaleString()} P
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.balanceAfter.toLocaleString()} P
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">거래 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
