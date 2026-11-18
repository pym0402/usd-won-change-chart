'use client'

import { useState, useEffect } from 'react'

interface PaymentMethod {
  id: string
  userId: string
  type: string
  paymentMethodId?: string
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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">결제 수단 관리</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

        <form onSubmit={handleAddPaymentMethod} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              결제 수단 유형
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'CARD' | 'BANK_ACCOUNT')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CARD">카드</option>
              <option value="BANK_ACCOUNT">계좌</option>
            </select>
          </div>

          {type === 'CARD' && (
            <div>
              <label htmlFor="paymentMethodId" className="block text-sm font-medium text-gray-700 mb-1">
                카드 ID
              </label>
              <input
                type="text"
                id="paymentMethodId"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="카드 결제 수단 ID"
                required
              />
            </div>
          )}

          {type === 'BANK_ACCOUNT' && (
            <>
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                  은행명
                </label>
                <input
                  type="text"
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="은행명 (예: 신한은행)"
                  required
                />
              </div>
              <div>
                <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 mb-1">
                  계좌번호
                </label>
                <input
                  type="text"
                  id="bankAccount"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="계좌번호"
                  required
                />
              </div>
            </>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
              기본 결제 수단으로 설정
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? '등록 중...' : '결제 수단 등록'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">등록된 결제 수단</h3>
        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {method.type === 'CARD' ? '카드' : '계좌'}
                    </span>
                    {method.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        기본
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {method.type === 'CARD'
                      ? `카드 ID: ${method.paymentMethodId}`
                      : `${method.bankName} - ${method.bankAccount}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    등록일: {new Date(method.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                    >
                      기본 설정
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">등록된 결제 수단이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
