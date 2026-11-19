'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Next Pay - 고객 포털</h1>
            {pathname !== '/customer' && (
              <nav className="flex gap-4">
                <Link
                  href="/customer"
                  className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  고객용 대시보드
                </Link>
              </nav>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
