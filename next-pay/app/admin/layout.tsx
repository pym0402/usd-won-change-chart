import { PortalShell } from '@/app/_portal/portal-shell'

const links = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/merchants', label: '가맹점 관리' },
  { href: '/admin/applications', label: '입점 심사' },
  { href: '/admin/ledger', label: '복식부기 원장' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell title="관리자 포털" links={links}>{children}</PortalShell>
}
