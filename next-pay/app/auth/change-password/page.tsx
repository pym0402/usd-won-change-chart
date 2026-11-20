import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PasswordForm } from './password-form'

export default async function ChangePasswordPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')
  return <PasswordForm temporary={session.user.mustChangePassword === true} />
}
