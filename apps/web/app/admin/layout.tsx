import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminNav from './components/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  if (!session.user.isAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <AdminNav />
      <main>{children}</main>
    </div>
  )
}
