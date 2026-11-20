import { NextResponse } from 'next/server'
import { authorize } from '@/lib/authorize'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await authorize('CUSTOMER')
  if (user instanceof NextResponse) return user

  const merchants = await prisma.merchant.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, businessName: true },
    orderBy: [{ businessName: 'asc' }, { id: 'asc' }],
  })
  return NextResponse.json(merchants)
}
