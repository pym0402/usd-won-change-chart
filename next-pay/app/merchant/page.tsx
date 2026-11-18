'use client'

import { useEffect, useState } from 'react'
import { SettlementStatus } from '@prisma/client'
import Link from 'next/link'
import { DollarSign, TrendingDown, TrendingUp, Clock, Key, CreditCard, Code, Copy, Check } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card } from '@/components/ui/card'
import { SettlementChart } from '@/components/charts/settlement-chart'

interface SettlementSummary {
  totalGrossAmount: number
  totalCommission: number
  totalNetAmount: number
  pendingCount: number
  completedCount: number
  commissionRate: number
}

interface ChartDataPoint {
  date: string
  grossAmount: number
  netAmount: number
  commission: number
}

export default function MerchantPage() {
  const [summary, setSummary] = useState<SettlementSummary | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchSettlementSummary()
    fetchChartData()
  }, [])

  const fetchSettlementSummary = async () => {
    try {
      const response = await fetch('/api/settlements/summary')
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('정산 요약 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/settlements/charts?days=30')
      if (response.ok) {
        const data = await response.json()
        setChartData(data)
      }
    } catch (error) {
      console.error('차트 데이터 조회 오류:', error)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const formatRate = (rate: number) => {
    return (rate * 100).toFixed(1) + '%'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateApiKey = () => {
    return 'pk_test_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
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
      <h2 className="text-3xl font-bold text-gray-900">가맹점 대시보드</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="총 결제 금액"
          value={summary ? formatAmount(summary.totalGrossAmount) : '-'}
          icon={DollarSign}
        />
        <Card
          title="총 수수료"
          value={summary ? formatAmount(summary.totalCommission) : '-'}
          subtitle={`수수료율: ${summary ? formatRate(summary.commissionRate) : '-'}`}
          icon={TrendingDown}
        />
        <Card
          title="총 정산 금액 (순수익)"
          value={summary ? formatAmount(summary.totalNetAmount) : '-'}
          subtitle="수수료 제외 실수령액"
          icon={TrendingUp}
          highlight
        />
        <Card
          title="정산 대기"
          value={`${summary?.pendingCount || 0}건`}
          subtitle={`완료: ${summary?.completedCount || 0}건`}
          icon={Clock}
        />
      </div>

      {chartData.length > 0 && (
        <SettlementChart data={chartData} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/merchant/settlements"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">정산 내역</h3>
              <p className="text-gray-600 text-sm">자세한 정산 내역 및 상태 확인</p>
            </div>
          </div>
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Key className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API 키 관리</h3>
              <p className="text-gray-600 text-sm">결제 API 키 발급 및 관리</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-xs font-medium text-gray-500 mb-1">테스트 API Key</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm font-mono text-gray-700 bg-white px-3 py-2 rounded border border-gray-200">
                  {generateApiKey()}
                </code>
                <button
                  onClick={() => copyToClipboard(generateApiKey())}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="복사"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              * 이 키는 샌드박스 환경에서만 사용 가능합니다.
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Code className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SDK 연동 가이드</h3>
              <p className="text-gray-600 text-sm">외부 쇼핑몰에 결제 기능 연동</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Link
              href="/merchant/sdk-guide"
              className="block w-full text-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            >
              연동 가이드 보기
            </Link>
            <div className="text-xs text-gray-500 text-center">
              JavaScript, Python, PHP SDK 지원
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
