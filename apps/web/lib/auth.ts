import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import TwitterProvider from 'next-auth/providers/twitter'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@gladiator/database'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  trustHost: true, // Required for Vercel and other proxies so callback URL is trusted
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Fetch full user data including isAdmin
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            walletAddress: true,
            isAdmin: true
          },
        })
        session.user.walletAddress = dbUser?.walletAddress
        session.user.isAdmin = dbUser?.isAdmin ?? false
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
