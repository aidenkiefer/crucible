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
