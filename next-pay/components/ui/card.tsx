import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface CardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  highlight?: boolean
  className?: string
}

export function Card({ title, value, subtitle, icon: Icon, trend, highlight, className }: CardProps) {
  return (
    <div className={cn(
      'bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow',
      highlight ? 'border-green-200 ring-2 ring-green-100' : 'border-gray-100',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={cn('text-3xl font-bold', highlight ? 'text-green-600' : 'text-gray-900')}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={cn('text-sm font-medium', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-lg', highlight ? 'bg-green-50' : 'bg-blue-50')}>
            <Icon className={cn('w-6 h-6', highlight ? 'text-green-600' : 'text-blue-600')} />
          </div>
        )}
      </div>
    </div>
  )
}
