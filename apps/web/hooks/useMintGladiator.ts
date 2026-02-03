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
