'use client'

import { Code, Copy, Check, Download, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function SDKGuidePage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const jsCode = `// Next Pay SDK 설치
npm install @next-pay/sdk

// 초기화
const nextPay = require('@next-pay/sdk')('YOUR_API_KEY')

// 결제 생성
const payment = await nextPay.createPayment({
  amount: 10000,
  merchantId: 'merchant_123',
  description: '주문 #1234'
})

console.log('Payment ID:', payment.id)
console.log('Client Secret:', payment.clientSecret)`

  const pythonCode = `# Next Pay SDK 설치
pip install next-pay-sdk

# 초기화
from next_pay import NextPayClient
client = NextPayClient(api_key='YOUR_API_KEY')

# 결제 생성
payment = client.create_payment(
    amount=10000,
    merchant_id='merchant_123',
    description='주문 #1234'
)

print(f'Payment ID: {payment.id}')
print(f'Client Secret: {payment.client_secret}')`

  const phpCode = `// Next Pay SDK 설치
composer require next-pay/sdk

// 초기화
use NextPay\\NextPayClient;
$client = new NextPayClient('YOUR_API_KEY');

// 결제 생성
$payment = $client->createPayment([
    'amount' => 10000,
    'merchant_id' => 'merchant_123',
    'description' => '주문 #1234'
]);

echo "Payment ID: " . $payment->id;
echo "Client Secret: " . $payment->client_secret;`

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SDK 연동 가이드</h1>
        <p className="text-gray-600">외부 쇼핑몰에 Next Pay 결제 기능을 연동하는 방법을 안내합니다.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Code className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">샌드박스 환경</h3>
            <p className="text-sm text-blue-700">
              이 가이드는 테스트 환경에서의 연동 방법입니다. 실제 운영 환경에서는 별도의 승인 후 라이브 API Key를 발급받으세요.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. API Key 발급</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>가맹점 대시보드에서 <span className="font-medium">API 키 관리</span> 섹션으로 이동</li>
              <li><span className="font-medium">새 API Key 생성</span> 버튼 클릭</li>
              <li>생성된 API Key를 안전한 곳에 저장 (다시 확인할 수 없습니다)</li>
              <li>환경 변수에 설정: <code className="bg-gray-100 px-2 py-1 rounded text-sm">NEXT_PAY_API_KEY=your_api_key</code></li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. JavaScript SDK</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">JavaScript/Node.js</span>
              <button
                onClick={() => copyCode(jsCode, 'js')}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
              >
                {copied === 'js' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied === 'js' ? '복사됨' : '복사'}</span>
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm bg-gray-900 text-gray-100">
              <code>{jsCode}</code>
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Python SDK</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Python</span>
              <button
                onClick={() => copyCode(pythonCode, 'python')}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
              >
                {copied === 'python' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied === 'python' ? '복사됨' : '복사'}</span>
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm bg-gray-900 text-gray-100">
              <code>{pythonCode}</code>
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. PHP SDK</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">PHP</span>
              <button
                onClick={() => copyCode(phpCode, 'php')}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
              >
                {copied === 'php' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied === 'php' ? '복사됨' : '복사'}</span>
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm bg-gray-900 text-gray-100">
              <code>{phpCode}</code>
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 웹훅 설정</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-700 mb-4">
              결제 상태 변경 시 알림을 받으려면 웹훅 URL을 설정하세요.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">웹훅 이벤트:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li><code className="bg-gray-200 px-1 rounded">payment.succeeded</code> - 결제 성공</li>
                <li><code className="bg-gray-200 px-1 rounded">payment.failed</code> - 결제 실패</li>
                <li><code className="bg-gray-200 px-1 rounded">payment.refunded</code> - 환불 완료</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. 테스트 및 라이브 전환</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">1</div>
                <div>
                  <p className="font-medium text-gray-900">샌드박스 환경에서 테스트</p>
                  <p className="text-sm text-gray-600">테스트 카드로 결제 흐름을 검증하세요</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">2</div>
                <div>
                  <p className="font-medium text-gray-900">보안 검수 통과</p>
                  <p className="text-sm text-gray-600">PCI DSS 등 보안 요구사항 확인</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">3</div>
                <div>
                  <p className="font-medium text-gray-900">라이브 API Key 발급</p>
                  <p className="text-sm text-gray-600">관리자 승인 후 라이브 환경으로 전환</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Link
            href="/merchant"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>대시보드로 돌아가기</span>
          </Link>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>전체 가이드 PDF 다운로드</span>
          </button>
        </div>
      </div>
    </div>
  )
}
