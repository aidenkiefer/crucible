import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { walletAddress } = await req.json()

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    // Check if wallet already linked to another account
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: 'Wallet already linked to another account' },
        { status: 409 }
      )
    }

    // Link wallet to user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Link wallet error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
