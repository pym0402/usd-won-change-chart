import Link from 'next/link'
import { Check, ChevronRight, ShieldCheck, Store, Wallet, Zap } from 'lucide-react'
import { auth } from '@/lib/auth'
import styles from './home.module.css'

const portals = [
  {
    href: '/customer',
    title: '고객 페이지',
    description: '포인트를 충전하고, 간편결제와 송금 내역을 확인하세요.',
    action: '고객 포털 열기',
    icon: Wallet,
    accent: styles.blue,
  },
  {
    href: '/merchant',
    title: '가맹점 페이지',
    description: '결제·정산 내역을 확인하고 QR 결제와 SDK를 연동하세요.',
    action: '가맹점 포털 열기',
    icon: Store,
    accent: styles.mint,
  },
  {
    href: '/admin',
    title: '관리자 페이지',
    description: '거래액과 수수료 수익을 보고 가맹점과 이상 거래를 관리하세요.',
    action: '관리자 포털 열기',
    icon: ShieldCheck,
    accent: styles.violet,
  },
]

function PaymentPreview() {
  return (
    <figure className={styles.preview}>
      <div className={styles.orbit} aria-hidden="true" />
      <div className={styles.payCard} aria-hidden="true">
        <div className={styles.cardBrand}>
          <Zap size={20} fill="currentColor" />
          Next Pay
        </div>
        <span className={styles.cardChip} />
        <span className={styles.cardRings} />
      </div>
      <div className={styles.receipt}>
        <div className={styles.receiptTop}>
          <span className={styles.check}><Check size={19} aria-hidden="true" /></span>
          <span>결제 완료</span>
        </div>
        <p className={styles.amount}>24,000원</p>
        <p className={styles.merchant}>넥스트 커피</p>
        <div className={styles.reward}>
          <span>포인트 적립</span>
          <strong>+240 P</strong>
        </div>
      </div>
      <figcaption className={styles.caption}>결제 화면 예시</figcaption>
    </figure>
  )
}

export default async function Home() {
  const session = await auth()

  return (
    <main className={styles.home}>
      <div className={styles.container}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.intro}>
            <h1 id="home-title" className={styles.title}>
              <span className={styles.brand}>Next Pay</span>
              일상의 결제부터<br />
              <span className={styles.highlight}>비즈니스 정산까지</span>
            </h1>
            <p className={styles.summary}>
              포인트와 카드로 간편결제를 이용하고,<br className={styles.lineBreak} />
              {' '}결제 내역과 가맹점 정산을 한곳에서 관리하세요.
            </p>
            {!session && (
              <div className={styles.actions}>
                <Link href="/auth/signin" className={styles.primary}>로그인</Link>
                <Link href="/auth/register" className={styles.secondary}>회원가입</Link>
              </div>
            )}
          </div>
          <PaymentPreview />
        </section>

        <section className={styles.portals} aria-labelledby="portal-title">
          <h2 id="portal-title" className={styles.sectionTitle}>서비스 바로가기</h2>
          <ul className={styles.portalGrid}>
            {portals.map(({ href, title, description, action, icon: Icon, accent }) => (
              <li key={href} className={accent}>
                <Link href={href} className={styles.portalCard}>
                  <span className={styles.portalIcon}>
                    <Icon size={24} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <h3 className={styles.portalTitle}>{title}</h3>
                  <p className={styles.portalDescription}>{description}</p>
                  <span className={styles.portalAction}>
                    {action}
                    <ChevronRight size={17} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
