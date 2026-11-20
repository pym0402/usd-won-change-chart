import { PortalShell } from '@/app/_portal/portal-shell'

const links = [
  { href: '/merchant', label: '대시보드' },
  { href: '/merchant/payments', label: '결제 내역' },
  { href: '/merchant/settlements', label: '정산 내역' },
  { href: '/merchant/qr-payment', label: 'QR 결제' },
  { href: '/merchant/sdk-guide', label: 'SDK 가이드' },
]

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell title="가맹점 포털" links={links}>{children}</PortalShell>
}
