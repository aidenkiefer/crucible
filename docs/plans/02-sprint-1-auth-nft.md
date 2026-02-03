# Sprint 1: Authentication & NFT Minting

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Users can authenticate with social providers, link wallets, and mint Gladiator NFTs

**Duration:** Week 2
**Prerequisites:** Sprint 0 complete

**Architecture:** Social auth via NextAuth.js, wallet linking with wagmi, NFT minting through smart contract, blockchain event listener for indexing

**Tech Stack:**
- NextAuth.js (authentication)
- wagmi + viem (Web3 wallet connection)
- Prisma (user data persistence)
- Ethers.js (contract interaction)

---

## Task 1: NextAuth.js Social Authentication

**Owner:** Dev 1
**Time:** 2 hours

**Files:**
- Create: `apps/web/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/web/lib/auth.ts`
- Create: `apps/web/components/auth/SignInButton.tsx`
- Create: `apps/web/app/auth/signin/page.tsx`

### Step 1: Install NextAuth dependencies

```bash
cd apps/web
pnpm add next-auth@beta @auth/prisma-adapter
```

### Step 2: Configure NextAuth with Prisma adapter

**File:** `apps/web/lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import TwitterProvider from 'next-auth/providers/twitter'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@gladiator/database/src/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
        // Attach wallet address if linked
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { walletAddress: true },
        })
        session.user.walletAddress = dbUser?.walletAddress
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
```

### Step 3: Create NextAuth API route

**File:** `apps/web/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### Step 4: Update Prisma schema for NextAuth

**File:** `packages/database/prisma/schema.prisma` (add to User model)

```prisma
model User {
  // ... existing fields ...

  // NextAuth fields
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### Step 5: Push schema changes

```bash
cd packages/database
pnpm db:push
```

### Step 6: Create sign-in button component

**File:** `apps/web/components/auth/SignInButton.tsx`

```typescript
'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export function SignInButton() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm">
          {session.user?.email}
        </span>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn()}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Sign In
    </button>
  )
}
```

### Step 7: Create sign-in page

**File:** `apps/web/app/auth/signin/page.tsx`

```typescript
'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

export default function SignIn() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Gladiator Coliseum</h1>
          <p className="mt-2 text-gray-600">Sign in to enter the arena</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              {/* Google Icon SVG */}
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => signIn('twitter', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              {/* Twitter Icon SVG */}
            </svg>
            Continue with Twitter
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Step 8: Add SessionProvider to layout

**File:** `apps/web/app/layout.tsx` (update)

```typescript
import { SessionProvider } from 'next-auth/react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

### Step 9: Test authentication flow

Run: `pnpm dev` and navigate to `/auth/signin`

Expected:
- Sign-in page renders with Google and Twitter buttons
- Clicking Google redirects to Google OAuth
- After auth, user redirected back to app
- User data saved in database

---

## Task 2: Wallet Connection with wagmi

**Owner:** Dev 1
**Time:** 1.5 hours

**Files:**
- Create: `apps/web/lib/wagmi.ts`
- Create: `apps/web/components/wallet/ConnectWallet.tsx`
- Create: `apps/web/app/api/user/link-wallet/route.ts`

### Step 1: Install wagmi dependencies

```bash
cd apps/web
pnpm add wagmi viem @tanstack/react-query
```

### Step 2: Configure wagmi

**File:** `apps/web/lib/wagmi.ts`

```typescript
import { createConfig, http } from 'wagmi'
import { polygonMumbai } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [polygonMumbai],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    }),
  ],
  transports: {
    [polygonMumbai.id]: http(),
  },
})
```

### Step 3: Add WagmiProvider to layout

**File:** `apps/web/app/layout.tsx` (update)

```typescript
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'

const queryClient = new QueryClient()

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <SessionProvider session={session}>
              {children}
            </SessionProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
```

### Step 4: Create ConnectWallet component

**File:** `apps/web/components/wallet/ConnectWallet.tsx`

```typescript
'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useEffect } from 'react'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  // Auto-link wallet to user account when connected
  useEffect(() => {
    if (isConnected && address) {
      linkWallet(address)
    }
  }, [isConnected, address])

  async function linkWallet(walletAddress: string) {
    try {
      const res = await fetch('/api/user/link-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      })

      if (!res.ok) {
        throw new Error('Failed to link wallet')
      }

      console.log('✅ Wallet linked successfully')
    } catch (error) {
      console.error('❌ Error linking wallet:', error)
    }
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-mono">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  )
}
```

### Step 5: Create API route to link wallet

**File:** `apps/web/app/api/user/link-wallet/route.ts`

```typescript
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
```

### Step 6: Test wallet connection

Run: `pnpm dev`

Expected:
- Connect wallet button renders
- Clicking opens MetaMask (or WalletConnect)
- After connection, wallet address displayed
- Database updated with wallet address

---

## Task 3: Deploy NFT Contract to Testnet

**Owner:** Dev 2
**Time:** 1 hour

**Files:**
- Update: `contracts/contracts/GladiatorNFT.sol` (enhance)
- Create: `contracts/scripts/verify.ts`
- Update: `.env` (add deployed contract address)

### Step 1: Get testnet MATIC

1. Visit https://faucet.polygon.technology/
2. Select Mumbai testnet
3. Enter your wallet address
4. Request test MATIC

### Step 2: Enhance Gladiator NFT contract

**File:** `contracts/contracts/GladiatorNFT.sol` (update)

Add proper stat generation based on class:

```solidity
function _randomStat(GladiatorClass class, uint256 seed) private view returns (uint8) {
    uint256 random = uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        msg.sender,
        seed,
        _tokenIdCounter.current()
    ))) % 30;

    uint8 baseMin = 50;
    uint8 variance = uint8(random);

    if (class == GladiatorClass.Duelist) {
        // High technique and agility
        if (seed == 1 || seed == 3) return baseMin + 20 + (variance % 10); // agility/technique
        return baseMin + variance;
    } else if (class == GladiatorClass.Brute) {
        // High strength and endurance
        if (seed == 0 || seed == 2) return baseMin + 20 + (variance % 10); // strength/endurance
        return baseMin + variance;
    } else { // Assassin
        // High agility and technique
        if (seed == 1 || seed == 3) return baseMin + 20 + (variance % 10);
        return baseMin + variance;
    }
}
```

### Step 3: Compile updated contract

```bash
cd contracts
pnpm compile
```

### Step 4: Deploy to Mumbai testnet

```bash
pnpm deploy:testnet
```

Expected output:
```
Deploying GladiatorNFT contract...
✅ GladiatorNFT deployed to: 0x1234...5678

Add this to your .env:
NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=0x1234...5678
```

### Step 5: Update .env with contract address

**File:** `.env` (add)

```bash
NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=0x... # from deployment output
```

### Step 6: Verify contract on PolygonScan

**File:** `contracts/scripts/verify.ts`

```typescript
import { run } from 'hardhat'

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS!

  console.log('Verifying contract on PolygonScan...')

  await run('verify:verify', {
    address: contractAddress,
    constructorArguments: [],
  })

  console.log('✅ Contract verified!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

Run verification:

```bash
npx hardhat verify --network mumbai <CONTRACT_ADDRESS>
```

---

## Task 4: NFT Minting UI

**Owner:** Dev 2
**Time:** 2 hours

**Files:**
- Create: `apps/web/app/mint/page.tsx`
- Create: `apps/web/components/mint/MintGladiator.tsx`
- Create: `apps/web/lib/contracts.ts`
- Create: `apps/web/hooks/useMintGladiator.ts`

### Step 1: Create contract interaction utilities

**File:** `apps/web/lib/contracts.ts`

```typescript
import { parseAbi } from 'viem'

export const GLADIATOR_NFT_ADDRESS = process.env.NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS as `0x${string}`

export const GLADIATOR_NFT_ABI = parseAbi([
  'function mint(uint8 class) public returns (uint256)',
  'function getGladiator(uint256 tokenId) public view returns (tuple(uint8 class, uint8 strength, uint8 agility, uint8 endurance, uint8 technique, uint256 mintedAt))',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'event GladiatorMinted(uint256 indexed tokenId, address indexed owner, uint8 class)',
])

export enum GladiatorClass {
  Duelist = 0,
  Brute = 1,
  Assassin = 2,
}
```

### Step 2: Create mint hook

**File:** `apps/web/hooks/useMintGladiator.ts`

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { GLADIATOR_NFT_ADDRESS, GLADIATOR_NFT_ABI } from '@/lib/contracts'

export function useMintGladiator() {
  const { data: hash, writeContract, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const mint = (gladiatorClass: number) => {
    writeContract({
      address: GLADIATOR_NFT_ADDRESS,
      abi: GLADIATOR_NFT_ABI,
      functionName: 'mint',
      args: [gladiatorClass],
    })
  }

  return {
    mint,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  }
}
```

### Step 3: Create mint component

**File:** `apps/web/components/mint/MintGladiator.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useMintGladiator } from '@/hooks/useMintGladiator'
import { GladiatorClass } from '@/lib/contracts'

const CLASS_INFO = {
  [GladiatorClass.Duelist]: {
    name: 'Duelist',
    description: 'Balanced fighter with high technique and agility',
    strengths: 'Technique, Agility',
  },
  [GladiatorClass.Brute]: {
    name: 'Brute',
    description: 'Raw power and endurance',
    strengths: 'Strength, Endurance',
  },
  [GladiatorClass.Assassin]: {
    name: 'Assassin',
    description: 'Swift and deadly',
    strengths: 'Agility, Technique',
  },
}

export function MintGladiator() {
  const { isConnected } = useAccount()
  const { mint, isPending, isConfirming, isSuccess, hash } = useMintGladiator()
  const [selectedClass, setSelectedClass] = useState<GladiatorClass>(GladiatorClass.Duelist)

  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <p>Please connect your wallet to mint a Gladiator</p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          Gladiator Minted Successfully! ⚔️
        </h2>
        <p className="text-sm text-gray-600">
          Transaction: {hash}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Mint Your Gladiator</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {Object.entries(CLASS_INFO).map(([classId, info]) => (
          <button
            key={classId}
            onClick={() => setSelectedClass(Number(classId))}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedClass === Number(classId)
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <h3 className="font-bold text-lg mb-2">{info.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{info.description}</p>
            <p className="text-xs text-gray-500">
              <strong>Strengths:</strong> {info.strengths}
            </p>
          </button>
        ))}
      </div>

      <button
        onClick={() => mint(selectedClass)}
        disabled={isPending || isConfirming}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isPending || isConfirming ? 'Minting...' : 'Mint Gladiator'}
      </button>
    </div>
  )
}
```

### Step 4: Create mint page

**File:** `apps/web/app/mint/page.tsx`

```typescript
import { MintGladiator } from '@/components/mint/MintGladiator'

export default function MintPage() {
  return (
    <main className="min-h-screen py-12">
      <MintGladiator />
    </main>
  )
}
```

### Step 5: Test minting flow

1. Navigate to `/mint`
2. Connect wallet
3. Select Gladiator class
4. Click "Mint Gladiator"
5. Approve MetaMask transaction
6. Wait for confirmation

Expected: Transaction successful, NFT minted

---

## Task 5: Blockchain Event Listener

**Owner:** Dev 2
**Time:** 2 hours

**Files:**
- Create: `apps/game-server/src/services/blockchain-listener.ts`
- Create: `apps/game-server/src/services/gladiator-sync.ts`
- Update: `apps/game-server/src/index.ts`

### Step 1: Install ethers.js in game server

```bash
cd apps/game-server
pnpm add ethers dotenv
```

### Step 2: Create blockchain listener service

**File:** `apps/game-server/src/services/blockchain-listener.ts`

```typescript
import { ethers } from 'ethers'
import { GLADIATOR_NFT_ABI } from './abi'

const RPC_URL = process.env.POLYGON_MUMBAI_RPC_URL!
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS!

export class BlockchainListener {
  private provider: ethers.JsonRpcProvider
  private contract: ethers.Contract

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL)
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      GLADIATOR_NFT_ABI,
      this.provider
    )
  }

  async start(onMint: (tokenId: bigint, owner: string, gladiatorClass: number) => void) {
    console.log('🔗 Starting blockchain listener...')

    // Listen for GladiatorMinted events
    this.contract.on('GladiatorMinted', async (tokenId, owner, gladiatorClass, event) => {
      console.log(`📡 New Gladiator minted: ${tokenId}`)

      try {
        await onMint(tokenId, owner, Number(gladiatorClass))
      } catch (error) {
        console.error('Error processing mint event:', error)
      }
    })

    // Optionally: sync historical events on startup
    await this.syncHistoricalEvents(onMint)
  }

  async syncHistoricalEvents(onMint: (tokenId: bigint, owner: string, gladiatorClass: number) => void) {
    console.log('🔄 Syncing historical mint events...')

    const filter = this.contract.filters.GladiatorMinted()
    const events = await this.contract.queryFilter(filter, -10000) // Last ~10k blocks

    for (const event of events) {
      const [tokenId, owner, gladiatorClass] = event.args!
      await onMint(tokenId, owner, Number(gladiatorClass))
    }

    console.log(`✅ Synced ${events.length} historical events`)
  }

  async getGladiatorData(tokenId: bigint) {
    const gladiator = await this.contract.getGladiator(tokenId)
    return {
      class: Number(gladiator.class),
      strength: Number(gladiator.strength),
      agility: Number(gladiator.agility),
      endurance: Number(gladiator.endurance),
      technique: Number(gladiator.technique),
      mintedAt: Number(gladiator.mintedAt),
    }
  }
}
```

### Step 3: Create Gladiator sync service

**File:** `apps/game-server/src/services/gladiator-sync.ts`

```typescript
import { prisma } from '@gladiator/database/src/client'
import { BlockchainListener } from './blockchain-listener'

const listener = new BlockchainListener()

export async function startGladiatorSync() {
  await listener.start(async (tokenId, ownerAddress, gladiatorClass) => {
    console.log(`Processing mint: tokenId=${tokenId}, owner=${ownerAddress}`)

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress: ownerAddress.toLowerCase() },
    })

    if (!user) {
      console.warn(`User not found for wallet: ${ownerAddress}`)
      return
    }

    // Check if already synced
    const existing = await prisma.gladiator.findUnique({
      where: { tokenId: Number(tokenId) },
    })

    if (existing) {
      console.log(`Gladiator ${tokenId} already synced`)
      return
    }

    // Fetch full gladiator data from contract
    const data = await listener.getGladiatorData(tokenId)

    // Create in database
    await prisma.gladiator.create({
      data: {
        tokenId: Number(tokenId),
        ownerId: user.id,
        class: getClassName(gladiatorClass),
        level: 1,
        xp: 0,
        strength: data.strength,
        agility: data.agility,
        endurance: data.endurance,
        technique: data.technique,
        skillPointsAvailable: 0,
        unlockedSkills: [],
      },
    })

    console.log(`✅ Gladiator ${tokenId} synced to database`)
  })
}

function getClassName(classId: number): string {
  const classes = ['Duelist', 'Brute', 'Assassin']
  return classes[classId] || 'Duelist'
}
```

### Step 4: Create ABI file

**File:** `apps/game-server/src/services/abi.ts`

```typescript
export const GLADIATOR_NFT_ABI = [
  'function mint(uint8 class) public returns (uint256)',
  'function getGladiator(uint256 tokenId) public view returns (tuple(uint8 class, uint8 strength, uint8 agility, uint8 endurance, uint8 technique, uint256 mintedAt))',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'event GladiatorMinted(uint256 indexed tokenId, address indexed owner, uint8 class)',
]
```

### Step 5: Start listener in server

**File:** `apps/game-server/src/index.ts` (update)

```typescript
import dotenv from 'dotenv'
import { createServer } from './server'
import { startGladiatorSync } from './services/gladiator-sync'

dotenv.config()

const PORT = process.env.PORT || 4000

async function main() {
  const server = createServer()

  server.listen(PORT, () => {
    console.log(`🎮 Game server running on port ${PORT}`)
  })

  // Start blockchain event listener
  await startGladiatorSync()
}

main().catch(console.error)
```

### Step 6: Test event listener

1. Mint a Gladiator NFT
2. Check game server logs
3. Verify Gladiator appears in database

Expected: Blockchain events captured, data synced to DB

---

## Task 6: Basic Admin Panel

**Owner:** Dev 3
**Time:** 1.5 hours

**Files:**
- Create: `apps/web/app/admin/page.tsx`
- Create: `apps/web/app/api/admin/gladiators/route.ts`
- Create: `apps/web/app/api/admin/users/route.ts`

### Step 1: Create admin dashboard page

**File:** `apps/web/app/admin/page.tsx`

```typescript
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@gladiator/database/src/client'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch stats
  const [userCount, gladiatorCount, matchCount] = await Promise.all([
    prisma.user.count(),
    prisma.gladiator.count(),
    prisma.match.count(),
  ])

  const recentGladiators = await prisma.gladiator.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: {
        select: { email: true, walletAddress: true },
      },
    },
  })

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-6 bg-blue-100 rounded-lg">
          <div className="text-3xl font-bold">{userCount}</div>
          <div className="text-gray-600">Total Users</div>
        </div>
        <div className="p-6 bg-green-100 rounded-lg">
          <div className="text-3xl font-bold">{gladiatorCount}</div>
          <div className="text-gray-600">Total Gladiators</div>
        </div>
        <div className="p-6 bg-purple-100 rounded-lg">
          <div className="text-3xl font-bold">{matchCount}</div>
          <div className="text-gray-600">Total Matches</div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Gladiators</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Token ID</th>
                <th className="px-6 py-3 text-left">Class</th>
                <th className="px-6 py-3 text-left">Level</th>
                <th className="px-6 py-3 text-left">Owner</th>
                <th className="px-6 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentGladiators.map((g) => (
                <tr key={g.id}>
                  <td className="px-6 py-4">{g.tokenId}</td>
                  <td className="px-6 py-4">{g.class}</td>
                  <td className="px-6 py-4">{g.level}</td>
                  <td className="px-6 py-4 text-sm">
                    {g.owner.email}
                    <br />
                    <span className="text-gray-500 text-xs">
                      {g.owner.walletAddress?.slice(0, 10)}...
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(g.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

---

## Verification Checklist

After completing Sprint 1, verify:

- [ ] Users can sign in with Google OAuth
- [ ] Users can sign in with Twitter OAuth
- [ ] User data persisted in database
- [ ] Users can connect wallet (MetaMask)
- [ ] Wallet address linked to user account
- [ ] Gladiator NFT contract deployed to Mumbai testnet
- [ ] Mint UI functional with class selection
- [ ] NFT minting transaction succeeds
- [ ] Blockchain event listener captures mint events
- [ ] Minted Gladiators synced to database
- [ ] Admin panel displays stats and recent Gladiators

---

## Next Sprint

**Sprint 2: Combat System - CPU Battles**

See: `docs/plans/03-sprint-2-combat-cpu.md`
