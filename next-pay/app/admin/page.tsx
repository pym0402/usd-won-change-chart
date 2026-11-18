'use client'

import { useEffect, useState } from 'react'
import { SettlementStatus } from '@prisma/client'
import { TrendingUp, DollarSign, Store, Clock, AlertTriangle, Shield, Eye, PieChart } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
        return 'bg-red-100 text-red-700'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700'
      case 'LOW':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
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
        return 'bg-yellow-100 text-yellow-700'
      case 'REVIEWED':
        return 'bg-blue-100 text-blue-700'
      case 'BLOCKED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
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
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">관리자 대시보드</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="GMV"
          value={stats ? formatAmount(stats.gmv) : '-'}
          subtitle={`${stats?.transactionCount || 0}건 거래`}
          icon={TrendingUp}
        />
        <Card
          title="수수료 수익"
          value={stats ? formatAmount(stats.commissionRevenue) : '-'}
          subtitle={`${stats?.settlementCount || 0}건 정산`}
          icon={DollarSign}
        />
        <Card
          title="활성 가맹점"
          value={`${stats?.activeMerchants || 0}개`}
          subtitle={<a href="/admin/merchants" className="text-blue-600 hover:underline">관리하기</a>}
          icon={Store}
        />
        <Card
          title="이상 결제 감지"
          value={`${stats?.fdsStats?.review || suspiciousTransactions.filter(t => t.status === 'PENDING').length}건`}
          subtitle={`총 ${stats?.fdsStats?.total || suspiciousTransactions.length}건`}
          icon={Shield}
          highlight
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartData && chartData.gmvData.length > 0 && (
          <GMVChart data={chartData.gmvData} />
        )}
        {chartData && chartData.revenueData.length > 0 && (
          <RevenueChart data={chartData.revenueData} />
        )}
      </div>

      {categoryData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">카테고리별 거래액 비중</h3>
                <p className="text-sm text-gray-500">가맹점 비즈니스 유형별 거래 분석</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryData.map((category) => (
              <div key={category.category} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{category.category}</h4>
                  <span className="text-sm font-medium text-purple-600">{category.percentage}%</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>총 거래액</span>
                    <span className="font-medium">{formatAmount(category.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>거래 건수</span>
                    <span className="font-medium">{category.transactionCount}건</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>가맹점 수</span>
                    <span className="font-medium">{category.merchantCount}개</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">정산 승인 대기 목록</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/api/admin/settlements/export'}
          >
            CSV 다운로드
          </Button>
        </div>

        {settlements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">승인 대기 중인 정산이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    가맹점
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    결제 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    총 금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    수수료
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    정산 금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {settlement.merchant.businessName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {settlement.payment.id.slice(0, 12)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(settlement.grossAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      {formatAmount(settlement.commission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {formatAmount(settlement.netAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(settlement.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
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
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">이상 결제 감지 (FDS)</h3>
              <p className="text-sm text-gray-500">Fraud Detection System - 의심스러운 결제 모니터링</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            전체 보기
          </Button>
        </div>

        {suspiciousTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">감지된 이상 결제가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    결제 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    고객 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    가맹점 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    위험 점수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    위험 등급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    사유
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    감지 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suspiciousTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
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
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              transaction.riskScore >= 80 ? 'bg-red-500' :
                              transaction.riskScore >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${transaction.riskScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{transaction.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(transaction.riskLevel)}`}>
                        {getRiskLevelText(transaction.riskLevel)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {transaction.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {transaction.status === 'PENDING' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleFraudAction(transaction.fraudDetectionId, 'ALLOW')}
                          >
                            허용
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleFraudAction(transaction.fraudDetectionId, 'BLOCK')}
                          >
                            차단
                          </Button>
                        </>
                      )}
                      {transaction.status === 'REVIEWED' && (
                        <span className="text-sm text-gray-500">처리됨</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
