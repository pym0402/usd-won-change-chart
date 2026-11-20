import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PortalHeading } from '@/app/_portal/portal'
import styles from '@/app/_portal/portal.module.css'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicationForm } from './application-form'
import localStyles from './apply.module.css'

const statusDetails = {
  PENDING: { label: '심사 대기', tone: styles.amber, message: '신청을 접수했습니다. 심사 결과를 이 화면에서 확인할 수 있습니다.' },
  APPROVED: { label: '승인 완료', tone: styles.mint, message: '가맹점 포털에서 결제와 정산 내역을 확인할 수 있습니다.' },
  REJECTED: { label: '신청 거절', tone: styles.red, message: '입점 심사 결과 신청이 거절되었습니다.' },
  SUSPENDED: { label: '이용 정지', tone: styles.red, message: '현재 이 가맹점의 이용이 정지되어 있습니다.' },
}

export default async function MerchantApplyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const merchant = await prisma.merchant.findUnique({
    where: { userId: session.user.id },
    select: { businessName: true, status: true, application: { select: { reason: true } } },
  })

  return (
    <div className={`${styles.stack} ${localStyles.application}`}>
      <PortalHeading title="가맹점 입점 신청" description="가맹점 정보를 제출하고 심사 결과를 확인하세요." />
      {merchant ? (
        <section className={styles.surface} aria-labelledby="application-status">
          <div className={styles.toolbar}>
            <h2 id="application-status">입점 상태</h2>
            <span className={`${styles.badge} ${statusDetails[merchant.status].tone}`}>
              {statusDetails[merchant.status].label}
            </span>
          </div>
          <div className={styles.sectionContent}>
            <h3>{merchant.businessName}</h3>
            <p className={styles.muted}>{statusDetails[merchant.status].message}</p>
            {merchant.status === 'REJECTED' && merchant.application?.reason && (
              <div className={styles.notice}>
                <strong>거절 사유</strong>
                <p className={localStyles.reason}>{merchant.application.reason}</p>
              </div>
            )}
            {merchant.status === 'PENDING' && (
              <form action="/merchant/apply" method="get">
                <button className={styles.button} type="submit">심사 상태 새로고침</button>
              </form>
            )}
            {merchant.status === 'APPROVED' && session.user.roles.includes('MERCHANT') && (
              <div>
                <Link href="/merchant" className={styles.primaryButton}>가맹점 대시보드 열기</Link>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className={styles.surface} aria-labelledby="application-form">
          <h2 id="application-form">가맹점 정보</h2>
          <ApplicationForm />
        </section>
      )}
    </div>
  )
}
