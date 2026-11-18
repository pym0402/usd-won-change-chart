import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await prisma.$connect()
    return NextResponse.json({ status: 'healthy', database: 'connected' })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', database: 'disconnected', error: 'Database connection failed' },
      { status: 503 }
    )
  }
}
