import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

export function useBlockIDWallet() {
  const { logout, authenticated } = usePrivy();
  const { wallets, ready } = useWallets();

  const activeWallet = wallets[0] ?? null;

  const publicKey = useMemo(() => {
    if (!activeWallet?.address) return null;
    try {
      return new PublicKey(activeWallet.address);
    } catch {
      return null;
    }
  }, [activeWallet?.address]);

  const connected = authenticated && !!activeWallet;

  const signTransaction = useMemo(() => {
    if (!activeWallet) return undefined;
    return async (tx: any) => {
      return await activeWallet.signTransaction(tx);
    };
  }, [activeWallet]);

  // For Privy embedded wallet users — use wallet's sendTransaction directly
  const sendTransaction = useMemo(() => {
    if (!activeWallet) return undefined;
    return async (tx: any, connection: any) => {
      try {
        console.log('[BlockID] sendTransaction called');
        console.log('[BlockID] walletClientType:', activeWallet.walletClientType);
        console.log('[BlockID] sendTransaction method exists:', typeof activeWallet.sendTransaction);
        const signature = await activeWallet.sendTransaction(tx, connection);
        console.log('[BlockID] success signature:', signature);
        return signature;
      } catch (err: any) {
        console.error('[BlockID] sendTransaction error:', err);
        console.error('[BlockID] error message:', err?.message);
        console.error('[BlockID] error code:', err?.code);
        throw err;
      }
    };
  }, [activeWallet]);

  const signMessage = useMemo(() => {
    if (!activeWallet) return undefined;
    return async (message: Uint8Array) => {
      return await activeWallet.signMessage(message);
    };
  }, [activeWallet]);

  const disconnect = async () => {
    // Privy logout handled by WalletIndicator directly
    // This only handles wallet-adapter state
  };

  // For CustomWalletModal compatibility
  const walletAdapters = wallets.map((w) => ({
    adapter: { name: w.walletClientType, icon: '' },
    readyState: 'Installed',
  }));

  const select = (_name: string) => {};

  return {
    publicKey,
    connected,
    disconnect,
    signTransaction,
    signMessage,
    sendTransaction,
    wallets: walletAdapters,
    select,
    ready,
    address: activeWallet?.address ?? null,
    isPrivyWallet: activeWallet?.walletClientType === 'privy',
  };
}
