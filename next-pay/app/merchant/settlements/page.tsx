'use client'

import { PortalHeading, PortalMetric, PortalTable } from '@/app/_portal/portal'
import styles from '@/app/_portal/portal.module.css'

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
        ? '/api/settlements?scope=merchant'
        : `/api/settlements?scope=merchant&status=${filter}`
      
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
        return styles.amber
      case 'PROCESSING':
        return styles.blue
      case 'COMPLETED':
        return styles.mint
      case 'FAILED':
        return styles.red
      default:
        return ''
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
    <div className={styles.stack}>
      <PortalHeading title="정산 대시보드" description="정산 상태를 확인하고 지급 금액과 수수료를 비교하세요." />

      <div className={styles.metrics}>
        <PortalMetric title="총 결제 금액" value={formatAmount(totalGrossAmount)} />
        <PortalMetric title="총 수수료" value={formatAmount(totalCommission)} />
        <PortalMetric title="총 정산 금액" value={formatAmount(totalNetAmount)} highlight />
      </div>

      <section className={styles.surface} aria-labelledby="settlement-list-title">
        <h2 id="settlement-list-title">정산 목록</h2>
        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label="정산 상태 필터">
            {(['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                aria-pressed={filter === status}
              >
                {status === 'ALL' ? '전체' : getStatusText(status)}
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = `/api/settlements/export?status=${filter === 'ALL' ? '' : filter}`}
            className={styles.button}
          >
            <Download className="w-4 h-4" />
            <span>CSV 다운로드</span>
          </Button>
        </div>

        <PortalTable label="정산 내역">
          <table>
            <thead>
              <tr>
                <th scope="col">
                  결제 ID
                </th>
                <th scope="col">
                  고객
                </th>
                <th scope="col">
                  총 금액
                </th>
                <th scope="col">
                  수수료
                </th>
                <th scope="col">
                  정산 금액
                </th>
                <th scope="col">
                  상태
                </th>
                <th scope="col">
                  정산일
                </th>
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    정산 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td className={styles.wrapCell}>
                      {settlement.payment.id}
                    </td>
                    <td className={styles.wrapCell}>
                      {settlement.payment.customer.name || settlement.payment.customer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(settlement.grossAmount)}
                    </td>
                    <td className={styles.negative}>
                      {formatAmount(settlement.commission)}
                    </td>
                    <td className={styles.positive}>
                      {formatAmount(settlement.netAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`${styles.badge} ${getStatusColor(settlement.status)}`}>
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
        </PortalTable>
      </section>
    </div>
  )
}
