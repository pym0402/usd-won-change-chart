import { NextResponse } from 'next/server'
import { auth } from './auth'
import type { UserRole } from './roles'

export async function authorize(...allowedRoles: UserRole[]) {
  const session = await auth()
  const user = session?.user
  const id = user?.id

  if (!user || !id) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  if (!allowedRoles.some((role) => user.roles.includes(role))) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  return { ...user, id }
}
