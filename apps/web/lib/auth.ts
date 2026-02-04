import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import TwitterProvider from 'next-auth/providers/twitter'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@gladiator/database'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
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
    async jwt({ token, user: triggerUser }) {
      // On sign-in, triggerUser is the DB user from the adapter; persist id and isAdmin into the JWT
      if (triggerUser) {
        token.id = triggerUser.id
        const dbUser = await prisma.user.findUnique({
          where: { id: triggerUser.id },
          select: { isAdmin: true, walletAddress: true },
        })
        token.isAdmin = dbUser?.isAdmin ?? false
        token.walletAddress = dbUser?.walletAddress ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin === true
        session.user.walletAddress = token.walletAddress ?? undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
