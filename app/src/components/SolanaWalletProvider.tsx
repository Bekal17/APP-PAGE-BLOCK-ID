import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

const intentionalLogout = localStorage.getItem("blockid_logged_out") === "true";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: !intentionalLogout,
});

const wallets = [
  new SolflareWalletAdapter(),
];

const RPC_URL = import.meta.env.VITE_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';

export default function SolanaWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId="cmp6qkb0a01uo0cl8nl33gh42"
      config={{
        loginMethods: ['email', 'google', 'wallet'],
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
          showWalletUIs: false,
        },
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
        appearance: {
          theme: 'dark',
          accentColor: '#6366f1',
        },
        solana: {
          rpcs: {
            'solana:mainnet': {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              rpc: createSolanaRpc(RPC_URL) as any,
              rpcSubscriptions: createSolanaRpcSubscriptions(
                RPC_URL.replace('https://', 'wss://')
              ),
            },
          },
        },
      }}
    >
      <ConnectionProvider endpoint={RPC_URL}>
        <WalletProvider
          wallets={wallets}
          autoConnect={!intentionalLogout}
          onError={(error) => {
            const msg = error?.message ?? "";
            // Suppress internal wallet adapter errors that don't affect functionality
            if (
              msg.includes("not iterable") ||
              msg.includes("fall off the curve") ||
              msg.includes("read only property") ||
              msg.includes("WalletNotSelected")
            ) {
              return;
            }
            console.warn("[WalletProvider] error:", error);
          }}
        >
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </PrivyProvider>
  );
}
