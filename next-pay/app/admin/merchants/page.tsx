'use client'

import { PortalHeading, PortalMetric, PortalTable } from '@/app/_portal/portal'
import styles from '@/app/_portal/portal.module.css'

import { useEffect, useState } from 'react'
import { MerchantStatus } from '@prisma/client'
import { Store, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'

interface Merchant {
  id: string
  businessName: string
  status: MerchantStatus
  commissionRate: number
  bankName: string | null
  bankAccount: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
  }
  totalRevenue: number
  pendingSettlements: number
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    fetchMerchants()
  }, [filter])

  const fetchMerchants = async () => {
    try {
      const url = filter ? `/api/admin/merchants?status=${filter}` : '/api/admin/merchants'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setMerchants(data)
      }
    } catch (error) {
      console.error('가맹점 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateMerchantStatus = async (merchantId: string, status: 'APPROVED' | 'SUSPENDED') => {
    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        await fetchMerchants()
      }
    } catch (error) {
      console.error('가맹점 상태 업데이트 오류:', error)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const getStatusColor = (status: MerchantStatus) => {
    switch (status) {
      case 'APPROVED':
        return styles.mint
      case 'SUSPENDED':
        return styles.red
      case 'PENDING':
        return styles.amber
      case 'REJECTED':
        return ''
      default:
        return ''
    }
  }

  const getStatusText = (status: MerchantStatus) => {
    switch (status) {
      case 'APPROVED':
        return '활성'
      case 'SUSPENDED':
        return '정지'
      case 'PENDING':
        return '대기'
      case 'REJECTED':
        return '거부'
      default:
        return status
    }
  }

  const getStatusIcon = (status: MerchantStatus) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />
      case 'SUSPENDED':
        return <XCircle className="w-4 h-4" />
      case 'PENDING':
        return <Clock className="w-4 h-4" />
      case 'REJECTED':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={styles.stack}>
      <PortalHeading title="가맹점 관리" description="가맹점의 운영 상태, 매출과 정산 정보를 확인하세요." />
      <div className={styles.filters} role="group" aria-label="가맹점 상태 필터">
        <Button className={styles.button}
          aria-pressed={filter === ''}
          size="sm"
          onClick={() => setFilter('')}
        >
          전체
        </Button>
        <Button className={styles.button}
          aria-pressed={filter === 'APPROVED'}
          size="sm"
          onClick={() => setFilter('APPROVED')}
        >
          활성
        </Button>
        <Button className={styles.button}
          aria-pressed={filter === 'SUSPENDED'}
          size="sm"
          onClick={() => setFilter('SUSPENDED')}
        >
          정지
        </Button>
        <Button className={styles.button}
          aria-pressed={filter === 'PENDING'}
          size="sm"
          onClick={() => setFilter('PENDING')}
        >
          대기
        </Button>
      </div>

      <div className={styles.metrics}>
        <PortalMetric
          title="총 가맹점"
          value={`${merchants.length}개`}
          icon={Store}
        />
        <PortalMetric
          title="활성 가맹점"
          value={`${merchants.filter(m => m.status === 'APPROVED').length}개`}
          icon={CheckCircle}
        />
        <PortalMetric
          title="정지 가맹점"
          value={`${merchants.filter(m => m.status === 'SUSPENDED').length}개`}
          icon={XCircle}
        />
      </div>

      <div className={styles.surface}>
        <h3 className="text-xl font-bold text-gray-900 mb-6">가맹점 목록</h3>

        {merchants.length === 0 ? (
          <div className="text-center py-12">
            <p className={styles.empty}>가맹점이 없습니다.</p>
          </div>
        ) : (
          <PortalTable label="가맹점 목록">
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    가맹점명
                  </th>
                  <th scope="col">
                    담당자
                  </th>
                  <th scope="col">
                    상태
                  </th>
                  <th scope="col">
                    총 매출
                  </th>
                  <th scope="col">
                    대기 정산
                  </th>
                  <th scope="col">
                    수수료율
                  </th>
                  <th scope="col">
                    입금 계좌
                  </th>
                  <th scope="col">
                    가입일
                  </th>
                  <th scope="col">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {merchant.businessName}
                    </td>
                    <td className={styles.wrapCell}>
                      <div>
                        <div className="font-medium">{merchant.user.name || '-'}</div>
                        <div className="text-xs text-gray-500">{merchant.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`${styles.badge} ${getStatusColor(merchant.status)}`}>
                        {getStatusIcon(merchant.status)}
                        <span className="ml-1">{getStatusText(merchant.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatAmount(merchant.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {merchant.pendingSettlements}건
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {(merchant.commissionRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {merchant.bankName && merchant.bankAccount ? (
                        <div>
                          <div className="font-medium">{merchant.bankName}</div>
                          <div className="text-xs text-gray-500">{merchant.bankAccount}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(merchant.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {merchant.status === 'APPROVED' && (
                        <Button className={styles.dangerButton}
                          variant="danger"
                          size="sm"
                          onClick={() => updateMerchantStatus(merchant.id, 'SUSPENDED')}
                        >
                          정지
                        </Button>
                      )}
                      {merchant.status === 'SUSPENDED' && (
                        <Button className={styles.primaryButton}
                          variant="primary"
                          size="sm"
                          onClick={() => updateMerchantStatus(merchant.id, 'APPROVED')}
                        >
                          활성화
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PortalTable>
        )}
      </div>
    </div>
  )
}
