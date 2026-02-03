# Sprint 0: Project Setup & Infrastructure

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up complete development environment and core infrastructure for all team members

**Duration:** Week 1
**Team:** 3 developers (can work in parallel)

**Architecture:** Monorepo structure with separate apps for frontend, game server, and contracts. Shared TypeScript types and utilities.

**Tech Stack:**
- pnpm workspaces (monorepo)
- Next.js 14 (frontend)
- Node.js + Express (game server)
- Hardhat (smart contracts)
- Supabase (database)
- Prisma (ORM)

---

## Task 1: Initialize Monorepo Structure

**Owner:** Dev 1
**Time:** 30 minutes

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `turbo.json`
- Create: `.env.example`

### Step 1: Initialize root package.json

```bash
pnpm init
```

### Step 2: Create monorepo workspace config

**File:** `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'contracts'
```

### Step 3: Install Turborepo for build orchestration

```bash
pnpm add -D turbo
```

### Step 4: Create turbo.json configuration

**File:** `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^test"]
    }
  }
}
```

### Step 5: Create comprehensive .gitignore

**File:** `.gitignore`

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
.next/
out/
dist/
build/

# Environment
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/

# Blockchain
cache/
artifacts/
typechain-types/

# Logs
*.log
npm-debug.log*
pnpm-debug.log*
```

### Step 6: Create environment template

**File:** `.env.example`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_random_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Twitter OAuth
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Blockchain (Testnet)
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_deployer_private_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Game Server
GAME_SERVER_URL=http://localhost:4000
GAME_SERVER_SECRET=generate_random_secret

# Database
DATABASE_URL=your_postgres_connection_string
```

### Step 7: Update root package.json with scripts

**File:** `package.json`

```json
{
  "name": "gladiator-coliseum",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^1.11.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### Step 8: Create directory structure

```bash
mkdir -p apps/web apps/game-server packages/shared packages/database contracts docs/plans docs/api docs/guides
```

---

## Task 2: Frontend App Setup (Next.js)

**Owner:** Dev 1
**Time:** 45 minutes

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.js`
- Create: `apps/web/tailwind.config.js`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`

### Step 1: Initialize Next.js app

```bash
cd apps/web
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

### Step 2: Install additional dependencies

```bash
pnpm add @supabase/supabase-js next-auth wagmi viem @tanstack/react-query socket.io-client
pnpm add -D @types/node
```

### Step 3: Update package.json with workspace scripts

**File:** `apps/web/package.json` (add to existing)

```json
{
  "name": "@gladiator/web",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "clean": "rm -rf .next"
  }
}
```

### Step 4: Configure TypeScript

**File:** `apps/web/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"],
      "@gladiator/shared": ["../../packages/shared/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 5: Create basic layout

**File:** `apps/web/app/layout.tsx`

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gladiator Coliseum',
  description: 'Competitive 1v1 arena combat with NFT Gladiators',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### Step 6: Create placeholder homepage

**File:** `apps/web/app/page.tsx`

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Gladiator Coliseum</h1>
      <p className="text-xl text-gray-600">Arena awaits...</p>
    </main>
  )
}
```

### Step 7: Test frontend runs

```bash
cd apps/web
pnpm dev
```

Expected: Server starts on http://localhost:3000

---

## Task 3: Game Server Setup (Node.js + Express)

**Owner:** Dev 3
**Time:** 45 minutes

**Files:**
- Create: `apps/game-server/package.json`
- Create: `apps/game-server/tsconfig.json`
- Create: `apps/game-server/src/index.ts`
- Create: `apps/game-server/src/server.ts`
- Create: `apps/game-server/src/sockets/index.ts`

### Step 1: Initialize game server package

**File:** `apps/game-server/package.json`

```json
{
  "name": "@gladiator/game-server",
  "version": "0.1.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### Step 2: Configure TypeScript for Node.js

**File:** `apps/game-server/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@gladiator/shared": ["../../packages/shared/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: Create main entry point

**File:** `apps/game-server/src/index.ts`

```typescript
import dotenv from 'dotenv'
import { createServer } from './server'

dotenv.config()

const PORT = process.env.PORT || 4000

const server = createServer()

server.listen(PORT, () => {
  console.log(`🎮 Game server running on port ${PORT}`)
})
```

### Step 4: Create Express + Socket.io server

**File:** `apps/game-server/src/server.ts`

```typescript
import express from 'express'
import { createServer as createHTTPServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { setupSocketHandlers } from './sockets'

export function createServer() {
  const app = express()
  const httpServer = createHTTPServer(app)

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  })

  app.use(cors())
  app.use(express.json())

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Setup WebSocket handlers
  setupSocketHandlers(io)

  return httpServer
}
```

### Step 5: Create Socket.io connection handler

**File:** `apps/game-server/src/sockets/index.ts`

```typescript
import { Server, Socket } from 'socket.io'

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })

    // Placeholder for game events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() })
    })
  })
}
```

### Step 6: Install dependencies

```bash
cd apps/game-server
pnpm install
```

### Step 7: Test game server runs

```bash
pnpm dev
```

Expected: Server starts on port 4000, logs "🎮 Game server running on port 4000"

---

## Task 4: Smart Contracts Setup (Hardhat)

**Owner:** Dev 2
**Time:** 45 minutes

**Files:**
- Create: `contracts/package.json`
- Create: `contracts/hardhat.config.ts`
- Create: `contracts/contracts/GladiatorNFT.sol`
- Create: `contracts/scripts/deploy.ts`
- Create: `contracts/test/GladiatorNFT.test.ts`

### Step 1: Initialize Hardhat project

```bash
cd contracts
pnpm init -y
pnpm add --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

Select: "Create a TypeScript project"

### Step 2: Install OpenZeppelin contracts

```bash
pnpm add @openzeppelin/contracts
```

### Step 3: Update package.json

**File:** `contracts/package.json` (update scripts)

```json
{
  "name": "@gladiator/contracts",
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "deploy:local": "hardhat run scripts/deploy.ts --network localhost",
    "deploy:testnet": "hardhat run scripts/deploy.ts --network mumbai",
    "clean": "hardhat clean"
  }
}
```

### Step 4: Configure Hardhat

**File:** `contracts/hardhat.config.ts`

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      url: process.env.POLYGON_MUMBAI_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
```

### Step 5: Create Gladiator NFT contract (scaffold)

**File:** `contracts/contracts/GladiatorNFT.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract GladiatorNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Gladiator class types
    enum GladiatorClass { Duelist, Brute, Assassin }

    // Gladiator metadata
    struct Gladiator {
        GladiatorClass class;
        uint8 strength;
        uint8 agility;
        uint8 endurance;
        uint8 technique;
        uint256 mintedAt;
    }

    // Mapping from token ID to Gladiator data
    mapping(uint256 => Gladiator) public gladiators;

    // Base URI for metadata
    string private _baseTokenURI;

    event GladiatorMinted(
        uint256 indexed tokenId,
        address indexed owner,
        GladiatorClass class
    );

    constructor() ERC721("Gladiator", "GLAD") Ownable(msg.sender) {
        _baseTokenURI = "https://api.gladiator-coliseum.com/metadata/";
    }

    function mint(GladiatorClass class) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(msg.sender, tokenId);

        // Generate random stats (pseudo-random for demo)
        gladiators[tokenId] = Gladiator({
            class: class,
            strength: _randomStat(class, 0),
            agility: _randomStat(class, 1),
            endurance: _randomStat(class, 2),
            technique: _randomStat(class, 3),
            mintedAt: block.timestamp
        });

        emit GladiatorMinted(tokenId, msg.sender, class);

        return tokenId;
    }

    function _randomStat(GladiatorClass class, uint256 seed) private view returns (uint8) {
        // Simple pseudo-random (NOT secure, demo only)
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            seed,
            _tokenIdCounter.current()
        ))) % 30;

        // Class-based stat ranges (50-80)
        if (class == GladiatorClass.Duelist) {
            return uint8(50 + random);
        } else if (class == GladiatorClass.Brute) {
            return uint8(50 + random);
        } else {
            return uint8(50 + random);
        }
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function getGladiator(uint256 tokenId) public view returns (Gladiator memory) {
        require(_ownerOf(tokenId) != address(0), "Gladiator does not exist");
        return gladiators[tokenId];
    }
}
```

### Step 6: Create deployment script

**File:** `contracts/scripts/deploy.ts`

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GladiatorNFT contract...");

  const GladiatorNFT = await ethers.getContractFactory("GladiatorNFT");
  const gladiatorNFT = await GladiatorNFT.deploy();

  await gladiatorNFT.waitForDeployment();

  const address = await gladiatorNFT.getAddress();
  console.log(`✅ GladiatorNFT deployed to: ${address}`);

  // Save deployment info
  console.log("\nAdd this to your .env:");
  console.log(`NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 7: Compile contracts

```bash
pnpm compile
```

Expected: Contracts compile successfully, artifacts generated

### Step 8: Deploy to local network (optional test)

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy
pnpm deploy:local
```

Expected: Contract deploys, address printed

---

## Task 5: Shared Package Setup

**Owner:** Dev 1
**Time:** 30 minutes

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/constants/index.ts`

### Step 1: Create shared package

**File:** `packages/shared/package.json`

```json
{
  "name": "@gladiator/shared",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### Step 2: Configure TypeScript

**File:** `packages/shared/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: Create shared types

**File:** `packages/shared/src/types/index.ts`

```typescript
// Gladiator Types
export enum GladiatorClass {
  Duelist = 'Duelist',
  Brute = 'Brute',
  Assassin = 'Assassin',
}

export interface BaseStats {
  strength: number
  agility: number
  endurance: number
  technique: number
}

export interface Gladiator {
  id: string
  tokenId: number
  ownerId: string
  class: GladiatorClass
  level: number
  xp: number
  baseStats: BaseStats
  equippedWeaponId?: string
  equippedArmorId?: string
  skillPointsAvailable: number
  unlockedSkills: string[]
}

// Equipment Types
export enum EquipmentType {
  Weapon = 'Weapon',
  Armor = 'Armor',
}

export enum Rarity {
  Common = 'Common',
  Rare = 'Rare',
  Epic = 'Epic',
}

export interface Equipment {
  id: string
  ownerId: string
  type: EquipmentType
  rarity: Rarity
  name: string
  stats: {
    attack?: number
    defense?: number
    speed?: number
  }
}

// Combat Types
export enum CombatAction {
  LightAttack = 'LightAttack',
  HeavyAttack = 'HeavyAttack',
  Block = 'Block',
  Dodge = 'Dodge',
  SpecialAbility = 'SpecialAbility',
}

export interface CombatState {
  matchId: string
  player1: CombatantState
  player2: CombatantState
  currentTick: number
  isComplete: boolean
  winnerId?: string
}

export interface CombatantState {
  gladiatorId: string
  health: number
  maxHealth: number
  stamina: number
  maxStamina: number
  lastAction?: CombatAction
}

// Match Types
export interface Match {
  id: string
  player1GladiatorId: string
  player2GladiatorId?: string
  isCpuMatch: boolean
  winnerId?: string
  matchLog: ActionLog[]
  durationSeconds: number
  createdAt: string
}

export interface ActionLog {
  tick: number
  actorId: string
  action: CombatAction
  targetId: string
  damage?: number
  staminaCost: number
  result: string
}

// User Types
export interface User {
  id: string
  email: string
  walletAddress?: string
  username: string
  createdAt: string
}
```

### Step 4: Create shared constants

**File:** `packages/shared/src/constants/index.ts`

```typescript
// Combat Constants
export const COMBAT_TICK_INTERVAL = 1000 // milliseconds
export const BASE_HEALTH = 100
export const BASE_STAMINA = 100
export const STAMINA_REGEN_PER_TICK = 10

// Action Costs and Damage
export const ACTION_CONFIG = {
  LightAttack: {
    staminaCost: 10,
    baseDamage: 15,
    canBeBlocked: true,
    canBeDodged: true,
  },
  HeavyAttack: {
    staminaCost: 25,
    baseDamage: 30,
    canBeBlocked: true,
    canBeDodged: true,
  },
  Block: {
    staminaCost: 5,
    damageReduction: 0.75,
  },
  Dodge: {
    staminaCost: 15,
    dodgeChance: 0.8,
  },
}

// Progression Constants
export const XP_PER_WIN = 100
export const XP_PER_LOSS = 25
export const XP_TO_LEVEL = (level: number) => level * 100

// Loot Drop Rates
export const LOOT_DROP_RATES = {
  Common: 0.7,
  Rare: 0.25,
  Epic: 0.05,
}
```

### Step 5: Create barrel export

**File:** `packages/shared/src/index.ts`

```typescript
export * from './types'
export * from './constants'
```

---

## Task 6: Database Package Setup (Prisma)

**Owner:** Dev 1
**Time:** 45 minutes

**Files:**
- Create: `packages/database/package.json`
- Create: `packages/database/prisma/schema.prisma`
- Create: `packages/database/src/client.ts`

### Step 1: Create database package

**File:** `packages/database/package.json`

```json
{
  "name": "@gladiator/database",
  "version": "0.1.0",
  "main": "./src/client.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev",
    "clean": "rm -rf node_modules"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0"
  },
  "devDependencies": {
    "prisma": "^5.7.0",
    "typescript": "^5.3.3"
  }
}
```

### Step 2: Initialize Prisma

```bash
cd packages/database
pnpm install
npx prisma init
```

### Step 3: Create Prisma schema

**File:** `packages/database/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String       @id @default(uuid())
  email         String       @unique
  walletAddress String?      @unique
  username      String       @unique
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  gladiators    Gladiator[]
  equipment     Equipment[]
  matchesAsP1   Match[]      @relation("Player1Matches")
  matchesAsP2   Match[]      @relation("Player2Matches")
  friends       Friend[]     @relation("UserFriends")
  friendOf      Friend[]     @relation("FriendOf")
  challenges    Challenge[]  @relation("Challenger")
  challengedBy  Challenge[]  @relation("Opponent")
}

model Gladiator {
  id                    String   @id @default(uuid())
  tokenId               Int      @unique
  ownerId               String
  owner                 User     @relation(fields: [ownerId], references: [id])

  class                 String   // Duelist, Brute, Assassin
  level                 Int      @default(1)
  xp                    Int      @default(0)

  // Base stats
  strength              Int
  agility               Int
  endurance             Int
  technique             Int

  // Equipment
  equippedWeaponId      String?
  equippedWeapon        Equipment? @relation("EquippedWeapon", fields: [equippedWeaponId], references: [id])
  equippedArmorId       String?
  equippedArmor         Equipment? @relation("EquippedArmor", fields: [equippedArmorId], references: [id])

  // Progression
  skillPointsAvailable  Int      @default(0)
  unlockedSkills        String[] // Array of skill IDs

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  matchesAsP1           Match[]  @relation("Gladiator1Matches")
  matchesAsP2           Match[]  @relation("Gladiator2Matches")
  challengesAsG1        Challenge[] @relation("ChallengeGladiator1")
  challengesAsG2        Challenge[] @relation("ChallengeGladiator2")
}

model Equipment {
  id                String   @id @default(uuid())
  ownerId           String
  owner             User     @relation(fields: [ownerId], references: [id])

  type              String   // Weapon, Armor
  rarity            String   // Common, Rare, Epic
  name              String

  // Stats (nullable, depends on type)
  attackBonus       Int?
  defenseBonus      Int?
  speedBonus        Int?

  createdAt         DateTime @default(now())

  equippedByWeapon  Gladiator[] @relation("EquippedWeapon")
  equippedByArmor   Gladiator[] @relation("EquippedArmor")
}

model Match {
  id                  String   @id @default(uuid())

  player1GladiatorId  String
  player1Gladiator    Gladiator @relation("Gladiator1Matches", fields: [player1GladiatorId], references: [id])

  player2GladiatorId  String?
  player2Gladiator    Gladiator? @relation("Gladiator2Matches", fields: [player2GladiatorId], references: [id])

  isCpuMatch          Boolean  @default(false)

  winnerId            String?  // Gladiator ID of winner
  matchLog            Json     // Array of action logs
  durationSeconds     Int

  createdAt           DateTime @default(now())

  player1Id           String
  player1             User     @relation("Player1Matches", fields: [player1Id], references: [id])

  player2Id           String?
  player2             User?    @relation("Player2Matches", fields: [player2Id], references: [id])

  challenge           Challenge?
}

model Friend {
  userId      String
  user        User     @relation("UserFriends", fields: [userId], references: [id])

  friendId    String
  friend      User     @relation("FriendOf", fields: [friendId], references: [id])

  status      String   // pending, accepted
  createdAt   DateTime @default(now())

  @@id([userId, friendId])
  @@unique([userId, friendId])
}

model Challenge {
  id              String   @id @default(uuid())

  challengerId    String
  challenger      User     @relation("Challenger", fields: [challengerId], references: [id])

  opponentId      String
  opponent        User     @relation("Opponent", fields: [opponentId], references: [id])

  gladiator1Id    String
  gladiator1      Gladiator @relation("ChallengeGladiator1", fields: [gladiator1Id], references: [id])

  gladiator2Id    String
  gladiator2      Gladiator @relation("ChallengeGladiator2", fields: [gladiator2Id], references: [id])

  status          String   // pending, accepted, declined, completed

  matchId         String?  @unique
  match           Match?   @relation(fields: [matchId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Step 4: Create Prisma client wrapper

**File:** `packages/database/src/client.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 5: Generate Prisma Client

```bash
pnpm db:generate
```

Expected: Prisma client generated successfully

---

## Task 7: Supabase Project Setup

**Owner:** Dev 1
**Time:** 20 minutes (manual setup)

### Step 1: Create Supabase project

1. Go to https://supabase.com
2. Sign in and create new project
3. Choose project name: "gladiator-coliseum-dev"
4. Choose region (closest to team)
5. Generate strong database password (save it!)

### Step 2: Get connection details

Navigate to Project Settings → Database

Copy:
- Connection string (URI mode)
- Project URL
- Anon public key
- Service role key (secret!)

### Step 3: Update .env file

**File:** `.env` (root)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Prisma)
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
```

### Step 4: Push Prisma schema to Supabase

```bash
cd packages/database
pnpm db:push
```

Expected: Tables created in Supabase

### Step 5: Verify in Supabase dashboard

1. Go to Table Editor
2. Confirm tables exist: User, Gladiator, Equipment, Match, Friend, Challenge

---

## Task 8: CI/CD and Documentation

**Owner:** Dev 3
**Time:** 30 minutes

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `docs/guides/development-setup.md`
- Create: `README.md` (update existing)

### Step 1: Create GitHub Actions workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build

  test-contracts:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Test contracts
        run: cd contracts && pnpm test
```

### Step 2: Create development setup guide

**File:** `docs/guides/development-setup.md`

```markdown
# Development Setup Guide

## Prerequisites

- Node.js 20+
- pnpm 8+
- Git
- Supabase account
- MetaMask or similar Web3 wallet

## Initial Setup

### 1. Clone Repository

\`\`\`bash
git clone <repository-url>
cd gladiator-coliseum
\`\`\`

### 2. Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

### 3. Environment Configuration

Copy `.env.example` to `.env` and fill in values:

\`\`\`bash
cp .env.example .env
\`\`\`

Required environment variables:
- Supabase URL and keys (from Supabase dashboard)
- Database connection string
- OAuth credentials (Google, Twitter)
- Blockchain RPC URLs

### 4. Database Setup

\`\`\`bash
cd packages/database
pnpm db:push
\`\`\`

### 5. Run Development Servers

Terminal 1 - Frontend:
\`\`\`bash
cd apps/web
pnpm dev
\`\`\`

Terminal 2 - Game Server:
\`\`\`bash
cd apps/game-server
pnpm dev
\`\`\`

Terminal 3 - Local Blockchain (optional):
\`\`\`bash
cd contracts
npx hardhat node
\`\`\`

## Verification

- Frontend: http://localhost:3000
- Game Server: http://localhost:4000/health
- Prisma Studio: `pnpm db:studio` (from packages/database)

## Troubleshooting

### Port Already in Use

Change ports in respective configs:
- Frontend: `apps/web/package.json` (add `-p 3001` to dev script)
- Game Server: `apps/game-server/.env` (set `PORT=4001`)

### Database Connection Issues

1. Verify DATABASE_URL in .env
2. Check Supabase project is running
3. Ensure IP is whitelisted in Supabase (or disable IP restrictions)

### Contract Compilation Errors

\`\`\`bash
cd contracts
pnpm clean
pnpm compile
\`\`\`
```

### Step 3: Update root README

**File:** `README.md` (update existing)

Add to existing content:

```markdown
## Development

See [Development Setup Guide](docs/guides/development-setup.md) for detailed instructions.

### Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Push database schema
cd packages/database && pnpm db:push && cd ../..

# Run all services
pnpm dev
\`\`\`

## Project Structure

\`\`\`
gladiator-coliseum/
├── apps/
│   ├── web/              # Next.js frontend
│   └── game-server/      # WebSocket game server
├── packages/
│   ├── shared/           # Shared types and constants
│   └── database/         # Prisma schema and client
├── contracts/            # Solidity smart contracts
├── docs/                 # Documentation
│   ├── plans/           # Sprint plans
│   ├── api/             # API documentation
│   └── guides/          # Developer guides
└── README.md
\`\`\`

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, TailwindCSS, wagmi
- **Backend:** Node.js, Express, Socket.io, Supabase
- **Blockchain:** Solidity, Hardhat, OpenZeppelin
- **Database:** PostgreSQL (Supabase), Prisma ORM
```

---

## Verification Checklist

After completing Sprint 0, verify:

- [ ] Monorepo structure created with pnpm workspaces
- [ ] Frontend (Next.js) runs on localhost:3000
- [ ] Game server runs on localhost:4000
- [ ] Smart contracts compile successfully
- [ ] Supabase project created and connected
- [ ] Database schema pushed to Supabase
- [ ] Shared package exports types correctly
- [ ] All team members can run `pnpm dev` successfully
- [ ] CI/CD pipeline configured (GitHub Actions)
- [ ] Development setup documentation complete

---

## Next Sprint

**Sprint 1: Core Systems - Authentication & NFT Minting**

See: `docs/plans/02-sprint-1-auth-nft.md`
