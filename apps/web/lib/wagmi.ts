import { createConfig, http } from 'wagmi'
import { polygonMumbai } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

export const config = createConfig({
  chains: [polygonMumbai],
  connectors: [
    injected(),
    // Only add WalletConnect when project ID is set (avoids 403 / "Project ID Not Configured" in console)
    ...(walletConnectProjectId
      ? [walletConnect({ projectId: walletConnectProjectId })]
      : []),
  ],
  transports: {
    [polygonMumbai.id]: http(),
  },
})
