'use client'

import { useState, useEffect } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Dialog } from './dialog'
import { Button } from './button'
import { CreditCard, Lock } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  clientSecret: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

function PaymentForm({ clientSecret, amount, onSuccess, onError }: { clientSecret: string; amount: number; onSuccess: () => void; onError: (error: string) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!stripe || !elements) {
      setError('Stripe가 로드되지 않았습니다.')
      setLoading(false)
      return
    }

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('카드 요소를 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    })

    if (error) {
      setError(error.message || '결제에 실패했습니다.')
      onError(error.message || '결제에 실패했습니다.')
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">카드 정보</label>
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2147',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4" />
          <span>안전한 결제</span>
        </div>
        <span className="font-semibold">{amount.toLocaleString()}원</span>
      </div>

      <Button
        type="submit"
        loading={loading}
        disabled={!stripe || !elements}
        className="w-full"
      >
        {loading ? '결제 처리 중...' : `${amount.toLocaleString()}원 결제하기`}
      </Button>
    </form>
  )
}

export function StripePaymentModal({ isOpen, onClose, clientSecret, amount, onSuccess, onError }: StripePaymentModalProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#3b82f6',
      },
    },
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="결제하기">
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">결제 금액</p>
            <p className="text-lg font-bold text-blue-600">{amount.toLocaleString()}원</p>
          </div>
        </div>

        {clientSecret ? (
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm
              clientSecret={clientSecret}
              amount={amount}
              onSuccess={() => {
                onSuccess()
                onClose()
              }}
              onError={onError}
            />
          </Elements>
        ) : (
          <div className="text-center py-8 text-gray-500">
            결제 정보를 불러오는 중...
          </div>
        )}
      </div>
    </Dialog>
  )
}
