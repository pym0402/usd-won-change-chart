'use client'

import { PortalHeading, PortalMetric } from '@/app/_portal/portal'
import styles from '@/app/_portal/portal.module.css'

import { useEffect, useState } from 'react'
import { SettlementStatus } from '@prisma/client'
import Link from 'next/link'
import { DollarSign, TrendingDown, TrendingUp, Clock, Key, CreditCard, Code, Copy, Check } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
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

const exampleApiKey = 'pk_test_example_0000000000000000'

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={styles.stack}>
      <PortalHeading title="가맹점 대시보드" description="결제와 정산 흐름을 살펴보고 결제 연동을 관리하세요." />

      <div className={styles.metrics}>
        <PortalMetric
          title="총 결제 금액"
          value={summary ? formatAmount(summary.totalGrossAmount) : '-'}
          icon={DollarSign}
        />
        <PortalMetric
          title="총 수수료"
          value={summary ? formatAmount(summary.totalCommission) : '-'}
          subtitle={`수수료율: ${summary ? formatRate(summary.commissionRate) : '-'}`}
          icon={TrendingDown}
        />
        <PortalMetric
          title="총 정산 금액 (순수익)"
          value={summary ? formatAmount(summary.totalNetAmount) : '-'}
          subtitle="수수료 제외 실수령액"
          icon={TrendingUp}
          highlight
        />
        <PortalMetric
          title="정산 대기"
          value={`${summary?.pendingCount || 0}건`}
          subtitle={`완료: ${summary?.completedCount || 0}건`}
          icon={Clock}
        />
      </div>

      {chartData.length > 0 && (
        <div className={styles.chart}><SettlementChart data={chartData} /></div>
      )}

      <div className={styles.grid}>
        <Link
          href="/merchant/settlements"
          className={styles.workspaceCard}
        >
          <div className={styles.groupTitle}>
            <div className={styles.icon}>
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">정산 내역</h3>
              <p className="text-gray-600 text-sm">자세한 정산 내역 및 상태 확인</p>
            </div>
          </div>
        </Link>
        <div className={styles.surface}>
          <div className={styles.groupTitle}>
            <div className={styles.icon}>
              <Key className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">테스트 키 예시</h3>
              <p className="text-gray-600 text-sm">샌드박스 API 키 형식을 확인하세요.</p>
            </div>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.subcard}>
              <span className={styles.muted}>API 키 예시</span>
              <div className={styles.actions}>
                <code className={styles.inlineCode}>
                  {exampleApiKey}
                </code>
                <button
                  onClick={() => copyToClipboard(exampleApiKey)}
                  className={styles.button}
                  aria-label="테스트 키 복사"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
            </div>
            <div className={styles.muted}>
              API 요청에는 발급받은 키를 사용하세요.
            </div>
          </div>
        </div>
        <div className={styles.surface}>
          <div className={styles.groupTitle}>
            <div className={styles.icon}>
              <Code className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SDK 연동 가이드</h3>
              <p className="text-gray-600 text-sm">외부 쇼핑몰에 결제 기능 연동</p>
            </div>
          </div>
          <div className={styles.sectionContent}>
            <Link
              href="/merchant/sdk-guide"
              className={styles.button}
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
