import Link from 'next/link'
import { ChevronRight, CreditCard, Gift, Wallet, Zap } from 'lucide-react'
import homeStyles from '../home.module.css'
import styles from './customer.module.css'

const shortcuts = [
  {
    href: '/customer/wallet',
    title: '내 지갑',
    description: '포인트 잔액을 확인하고 충전·사용 내역을 살펴보세요.',
    icon: Wallet,
    accent: homeStyles.blue,
  },
  {
    href: '/customer/payments',
    title: '간편결제',
    description: '카드와 포인트로 결제를 테스트하고 결과를 확인하세요.',
    icon: Zap,
    accent: homeStyles.mint,
  },
  {
    href: '/customer/payment-methods',
    title: '결제 수단',
    description: '카드와 계좌를 등록하고 기본 결제 수단을 관리하세요.',
    icon: CreditCard,
    accent: homeStyles.violet,
  },
  {
    href: '/customer/transfer',
    title: '송금/선물',
    description: '다른 회원에게 포인트를 보내고 송금 내역을 확인하세요.',
    icon: Gift,
    accent: styles.amber,
  },
]

export default function CustomerPage() {
  return (
    <div className={styles.stack}>
      <header className={styles.pageHeader}>
        <h1>고객 대시보드</h1>
        <p>포인트 관리부터 결제와 송금까지 한곳에서 이용하세요.</p>
      </header>
      <ul className={styles.shortcutGrid}>
        {shortcuts.map(({ href, title, description, icon: Icon, accent }) => (
          <li key={href} className={accent}>
            <Link href={href} className={`${homeStyles.portalCard} ${styles.shortcut}`}>
              <span className={homeStyles.portalIcon}><Icon size={24} aria-hidden="true" /></span>
              <div className={styles.shortcutCopy}>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
              <ChevronRight size={20} className={styles.shortcutArrow} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
