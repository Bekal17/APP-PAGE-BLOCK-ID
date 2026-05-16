import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

const intentionalLogout = localStorage.getItem("blockid_logged_out") === "true";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: !intentionalLogout,
});

const wallets = [
  new PhantomWalletAdapter(),
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
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
        appearance: {
          theme: 'dark',
          accentColor: '#6366f1',
        },
      }}
    >
      <ConnectionProvider endpoint={RPC_URL}>
        <WalletProvider wallets={wallets} autoConnect={!intentionalLogout}>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </PrivyProvider>
  );
}
