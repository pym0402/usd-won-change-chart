import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import styles from './portal.module.css'

export function PortalHeading({ title, description }: { title: string; description: string }) {
  return (
    <header className={styles.pageHeader}>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  )
}

export function PortalTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.tableViewport} role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  )
}

export function PortalMetric({ title, value, subtitle, icon: Icon, highlight }: {
  title: string
  value: string | number
  subtitle?: ReactNode
  icon?: LucideIcon
  highlight?: boolean
}) {
  return (
    <div className={`${styles.metric} ${highlight ? styles.highlight : ''}`}>
      {Icon && <span className={styles.icon}><Icon size={21} aria-hidden="true" /></span>}
      <p>{title}</p>
      <strong>{value}</strong>
      {subtitle && <div>{subtitle}</div>}
    </div>
  )
}
