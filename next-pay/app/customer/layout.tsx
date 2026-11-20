'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import homeStyles from '../home.module.css'
import styles from './customer.module.css'

const navigation = [
  { href: '/customer', label: '대시보드' },
  { href: '/customer/wallet', label: '내 지갑' },
  { href: '/customer/payments', label: '간편결제' },
  { href: '/customer/payment-methods', label: '결제 수단' },
  { href: '/customer/transfer', label: '송금/선물' },
  { href: '/merchant/apply', label: '입점 신청' },
]

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className={`${homeStyles.home} ${styles.portal}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <p className={styles.portalName}>고객 포털</p>
          <nav aria-label="고객 포털 메뉴" className={styles.navigation}>
            {navigation.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className={styles.container}>
        {children}
      </main>
    </div>
  )
}
