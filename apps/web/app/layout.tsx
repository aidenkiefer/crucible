import type { Metadata } from 'next'
import { Inter, VT323 } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { WagmiProvider } from '@/components/providers/WagmiProvider'

const inter = Inter({ subsets: ['latin'] })
const vt323 = VT323({ weight: '400', subsets: ['latin'], variable: '--font-vt323' })

export const metadata: Metadata = {
  title: 'Gladiator Coliseum',
  description: 'Competitive 1v1 arena combat with NFT Gladiators',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={`${inter.className} ${vt323.variable}`}>
        <WagmiProvider>
          <SessionProvider session={session}>
            {children}
          </SessionProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
