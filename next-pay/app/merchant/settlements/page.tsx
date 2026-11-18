'use client'

import { useEffect, useState } from 'react'
import { SettlementStatus } from '@prisma/client'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Settlement {
  id: string
  grossAmount: number
  commission: number
  netAmount: number
  status: SettlementStatus
  settledAt: string | null
  createdAt: string
  payment: {
    id: string
    amount: number
    customer: {
      name: string
      email: string
    }
  }
}

export default function MerchantSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<SettlementStatus | 'ALL'>('ALL')

  useEffect(() => {
    fetchSettlements()
  }, [filter])

  const fetchSettlements = async () => {
    try {
      const url = filter === 'ALL' 
        ? '/api/settlements'
        : `/api/settlements?status=${filter}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSettlements(data)
      }
    } catch (error) {
      console.error('정산 내역 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const getStatusColor = (status: SettlementStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: SettlementStatus) => {
    switch (status) {
      case 'PENDING':
        return '대기'
      case 'PROCESSING':
        return '처리 중'
      case 'COMPLETED':
        return '완료'
      case 'FAILED':
        return '실패'
      default:
        return status
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>
  }

  const totalGrossAmount = settlements.reduce((sum, s) => sum + s.grossAmount, 0)
  const totalCommission = settlements.reduce((sum, s) => sum + s.commission, 0)
  const totalNetAmount = settlements.reduce((sum, s) => sum + s.netAmount, 0)

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">정산 대시보드</h2>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">총 결제 금액</h3>
          <p className="text-3xl font-bold text-gray-900">{formatAmount(totalGrossAmount)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">총 수수료</h3>
          <p className="text-3xl font-bold text-red-600">{formatAmount(totalCommission)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">총 정산 금액</h3>
          <p className="text-3xl font-bold text-green-600">{formatAmount(totalNetAmount)}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'ALL' ? '전체' : getStatusText(status)}
            </button>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.href = `/api/settlements/export?status=${filter === 'ALL' ? '' : filter}`}
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>CSV 다운로드</span>
        </Button>
      </div>

      {/* 정산 내역 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                결제 ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                고객
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                총 금액
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                수수료
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                정산 금액
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                정산일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {settlements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  정산 내역이 없습니다.
                </td>
              </tr>
            ) : (
              settlements.map((settlement) => (
                <tr key={settlement.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {settlement.payment.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {settlement.payment.customer.name || settlement.payment.customer.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatAmount(settlement.grossAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {formatAmount(settlement.commission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    {formatAmount(settlement.netAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(settlement.status)}`}>
                      {getStatusText(settlement.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(settlement.settledAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
