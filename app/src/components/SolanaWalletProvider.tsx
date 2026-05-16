import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

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
      {children}
    </PrivyProvider>
  );
}
