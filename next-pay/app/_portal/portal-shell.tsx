'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import homeStyles from '../home.module.css'
import styles from './portal.module.css'

export function PortalShell({ title, links, children }: {
  title: string
  links: ReadonlyArray<{ href: string; label: string }>
  children: ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className={`${homeStyles.home} ${styles.portal}`} data-portal={links[0]?.href}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <p>{title}</p>
          <nav aria-label={`${title} 메뉴`} className={styles.navigation}>
            {links.map(({ href, label }) => (
              <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className={styles.container}>{children}</main>
    </div>
  )
}
