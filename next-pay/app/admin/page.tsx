'use client'

import { PortalHeading, PortalMetric, PortalTable } from '@/app/_portal/portal'
import styles from '@/app/_portal/portal.module.css'

import { useEffect, useState } from 'react'
import { SettlementStatus } from '@prisma/client'
import { TrendingUp, DollarSign, Store, Clock, AlertTriangle, Shield, PieChart } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { GMVChart } from '@/components/charts/gmv-chart'
import { RevenueChart } from '@/components/charts/revenue-chart'

interface DashboardStats {
  gmv: number
  transactionCount: number
  commissionRevenue: number
  settlementCount: number
  activeMerchants: number
  pendingSettlements: number
  fdsStats?: {
    total: number
    blocked: number
    review: number
    allowed: number
    avgRiskScore: number
  }
}

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
  merchant: {
    businessName: string
    user: {
      email: string
    }
  }
}

interface ChartData {
  gmvData: Array<{ date: string; gmv: number; transactions: number }>
  revenueData: Array<{ date: string; commission: number; settlements: number }>
}

interface CategoryData {
  category: string
  totalAmount: number
  transactionCount: number
  merchantCount: number
  percentage: string
  topMerchants: Array<{
    name: string
    amount: number
    transactionCount: number
  }>
}

interface SuspiciousTransaction {
  id: string
  fraudDetectionId: string
  amount: number
  customerId: string
  merchantId: string
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
  createdAt: string
  status: 'PENDING' | 'REVIEWED' | 'BLOCKED'
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [suspiciousTransactions, setSuspiciousTransactions] = useState<SuspiciousTransaction[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
    fetchPendingSettlements()
    fetchChartData()
    fetchSuspiciousTransactions()
    fetchFDSStats()
    fetchCategoryData()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('대시보드 통계 조회 오류:', error)
    }
  }

  const fetchPendingSettlements = async () => {
    try {
      const response = await fetch('/api/settlements?status=PENDING')
      if (response.ok) {
        const data = await response.json()
        setSettlements(data)
      }
    } catch (error) {
      console.error('정산 대기 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/admin/charts?days=30')
      if (response.ok) {
        const data = await response.json()
        setChartData(data)
      }
    } catch (error) {
      console.error('차트 데이터 조회 오류:', error)
    }
  }

  const fetchSuspiciousTransactions = async () => {
    try {
      const response = await fetch('/api/admin/fds?filter=review')
      if (response.ok) {
        const data = await response.json()
        const formattedData: SuspiciousTransaction[] = data.map((item: any) => ({
          id: item.payment.id,
          fraudDetectionId: item.id,
          amount: item.payment.amount,
          customerId: item.payment.customerId,
          merchantId: item.payment.merchantId,
          riskScore: item.riskScore,
          riskLevel: item.riskScore >= 70 ? 'HIGH' : item.riskScore >= 40 ? 'MEDIUM' : 'LOW',
          reason: item.riskFactors && item.riskFactors.length > 0 ? item.riskFactors[0].description : '의심스러운 패턴',
          createdAt: item.createdAt,
          status: item.action === 'BLOCK' ? 'BLOCKED' : item.action === 'REVIEW' ? 'PENDING' : 'REVIEWED'
        }))
        setSuspiciousTransactions(formattedData)
      }
    } catch (error) {
      console.error('이상 결제 조회 오류:', error)
    }
  }

  const fetchFDSStats = async () => {
    try {
      const response = await fetch('/api/admin/fds/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(prev => prev ? { ...prev, fdsStats: data } : null)
      }
    } catch (error) {
      console.error('FDS 통계 조회 오류:', error)
    }
  }

  const fetchCategoryData = async () => {
    try {
      const response = await fetch('/api/admin/category-analysis')
      if (response.ok) {
        const data = await response.json()
        setCategoryData(data.summary)
      }
    } catch (error) {
      console.error('카테고리 데이터 조회 오류:', error)
    }
  }

  const approveSettlement = async (settlementId: string) => {
    try {
      const response = await fetch(`/api/settlements/${settlementId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionId: `TXN_${Date.now()}`
        })
      })

      if (response.ok) {
        await fetchPendingSettlements()
        await fetchDashboardStats()
        await fetchChartData()
      }
    } catch (error) {
      console.error('정산 승인 오류:', error)
    }
  }

  const handleFraudAction = async (fraudDetectionId: string, action: 'ALLOW' | 'BLOCK') => {
    try {
      const response = await fetch(`/api/admin/fds/${fraudDetectionId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        await fetchSuspiciousTransactions()
      }
    } catch (error) {
      console.error('FDS 조치 오류:', error)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return styles.red
      case 'MEDIUM':
        return styles.amber
      case 'LOW':
        return styles.mint
      default:
        return ''
    }
  }

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'HIGH':
        return '고위험'
      case 'MEDIUM':
        return '중위험'
      case 'LOW':
        return '저위험'
      default:
        return level
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return styles.amber
      case 'REVIEWED':
        return styles.blue
      case 'BLOCKED':
        return styles.red
      default:
        return ''
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '검토 대기'
      case 'REVIEWED':
        return '검토 완료'
      case 'BLOCKED':
        return '차단됨'
      default:
        return status
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
      <PortalHeading title="관리자 대시보드" description="거래 현황과 수수료 수익을 확인하고 정산과 이상 결제를 관리하세요." />

      <div className={styles.metrics}>
        <PortalMetric
          title="총 거래액 (GMV)"
          value={stats ? formatAmount(stats.gmv) : '-'}
          subtitle={`${stats?.transactionCount || 0}건 거래`}
          icon={TrendingUp}
        />
        <PortalMetric
          title="수수료 수익"
          value={stats ? formatAmount(stats.commissionRevenue) : '-'}
          subtitle={`${stats?.settlementCount || 0}건 정산`}
          icon={DollarSign}
        />
        <PortalMetric
          title="활성 가맹점"
          value={`${stats?.activeMerchants || 0}개`}
          subtitle={<a href="/admin/merchants" className={styles.textLink}>관리하기</a>}
          icon={Store}
        />
        <PortalMetric
          title="이상 결제 감지"
          value={`${stats?.fdsStats?.review || suspiciousTransactions.filter(t => t.status === 'PENDING').length}건`}
          subtitle={`총 ${stats?.fdsStats?.total || suspiciousTransactions.length}건`}
          icon={Shield}
          highlight
        />
      </div>

      <div className={styles.chartGrid}>
        {chartData && chartData.gmvData.length > 0 && (
          <div className={styles.chart}><GMVChart data={chartData.gmvData} /></div>
        )}
        {chartData && chartData.revenueData.length > 0 && (
          <div className={styles.chart}><RevenueChart data={chartData.revenueData} /></div>
        )}
      </div>

      {categoryData.length > 0 && (
        <div className={styles.surface}>
          <div className={styles.toolbar}>
            <div className={styles.groupTitle}>
              <div className={styles.icon}>
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">카테고리별 거래액 비중</h3>
                <p className="text-sm text-gray-500">가맹점 비즈니스 유형별 거래 분석</p>
              </div>
            </div>
          </div>

          <div className={styles.grid}>
            {categoryData.map((category) => (
              <div key={category.category} className={styles.subcard}>
                <div className={styles.split}>
                  <h4 className="font-semibold text-gray-900">{category.category}</h4>
                  <span className="text-sm font-medium text-purple-600">{category.percentage}%</span>
                </div>
                <div className="space-y-1">
                  <div className={styles.split}>
                    <span>총 거래액</span>
                    <span className="font-medium">{formatAmount(category.totalAmount)}</span>
                  </div>
                  <div className={styles.split}>
                    <span>거래 건수</span>
                    <span className="font-medium">{category.transactionCount}건</span>
                  </div>
                  <div className={styles.split}>
                    <span>가맹점 수</span>
                    <span className="font-medium">{category.merchantCount}개</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className={styles.progress}>
                    <div style={{ width: `${category.percentage}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.surface}>
        <div className={styles.toolbar}>
          <h3 className="text-xl font-bold text-gray-900">정산 승인 대기 목록</h3>
          <Button className={styles.button}
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/api/admin/settlements/export'}
          >
            CSV 다운로드
          </Button>
        </div>

        {settlements.length === 0 ? (
          <div className="text-center py-12">
            <p className={styles.empty}>승인 대기 중인 정산이 없습니다.</p>
          </div>
        ) : (
          <PortalTable label="정산 승인 대기 목록">
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    가맹점
                  </th>
                  <th scope="col">
                    결제 ID
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
                    생성일
                  </th>
                  <th scope="col">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {settlement.merchant.businessName}
                    </td>
                    <td className={styles.wrapCell}>
                      {settlement.payment.id.slice(0, 12)}...
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(settlement.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button className={styles.primaryButton}
                        variant="primary"
                        size="sm"
                        onClick={() => approveSettlement(settlement.id)}
                      >
                        승인
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PortalTable>
        )}
      </div>

      <div className={styles.surface}>
        <div className={styles.toolbar}>
          <div className={styles.groupTitle}>
            <div className={styles.icon}>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">이상 결제 감지 (FDS)</h3>
              <p className="text-sm text-gray-500">검토가 필요한 결제와 위험 점수를 확인하세요.</p>
            </div>
          </div>
        </div>

        {suspiciousTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className={styles.empty}>감지된 이상 결제가 없습니다.</p>
          </div>
        ) : (
          <PortalTable label="이상 결제 목록">
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    결제 ID
                  </th>
                  <th scope="col">
                    금액
                  </th>
                  <th scope="col">
                    고객 ID
                  </th>
                  <th scope="col">
                    가맹점 ID
                  </th>
                  <th scope="col">
                    위험 점수
                  </th>
                  <th scope="col">
                    위험 등급
                  </th>
                  <th scope="col">
                    사유
                  </th>
                  <th scope="col">
                    상태
                  </th>
                  <th scope="col">
                    감지 시간
                  </th>
                  <th scope="col">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {suspiciousTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className={styles.wrapCell}>
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatAmount(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.customerId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.merchantId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={styles.actions}>
                        <div className={styles.progress}>
                          <div
                            className={`${transaction.riskScore >= 80 ? styles.red : transaction.riskScore >= 50 ? styles.amber : styles.mint}`}
                            style={{ width: `${transaction.riskScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{transaction.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`${styles.badge} ${getRiskLevelColor(transaction.riskLevel)}`}>
                        {getRiskLevelText(transaction.riskLevel)}
                      </span>
                    </td>
                    <td className={styles.wrapCell}>
                      {transaction.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`${styles.badge} ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {transaction.status === 'PENDING' && (
                        <>
                          <Button className={styles.primaryButton}
                            variant="primary"
                            size="sm"
                            onClick={() => handleFraudAction(transaction.fraudDetectionId, 'ALLOW')}
                          >
                            허용
                          </Button>
                          <Button className={styles.dangerButton}
                            variant="danger"
                            size="sm"
                            onClick={() => handleFraudAction(transaction.fraudDetectionId, 'BLOCK')}
                          >
                            차단
                          </Button>
                        </>
                      )}
                      {transaction.status === 'REVIEWED' && (
                        <span className={styles.muted}>처리됨</span>
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
