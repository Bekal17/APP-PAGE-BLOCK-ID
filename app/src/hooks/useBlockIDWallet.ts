import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useMemo } from 'react';

export function useBlockIDWallet() {
  const { logout, authenticated } = usePrivy();
  const { wallets, ready } = useWallets();

  const activeWallet = wallets[0] ?? null;
  if (activeWallet) {
    console.log('[BlockIDWallet] walletClientType:', activeWallet.walletClientType);
    console.log('[BlockIDWallet] address:', activeWallet.address);
    console.log('[BlockIDWallet] wallet keys:', Object.keys(activeWallet));
  }

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

  const sendTransaction = useMemo(() => {
    if (!activeWallet) return undefined;
    return async (tx: any, _connection: any) => {
      let encoded: Uint8Array;
      if (tx instanceof Uint8Array) {
        encoded = tx;
      } else if (tx instanceof Transaction) {
        encoded = new Uint8Array(tx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }));
      } else {
        encoded = new Uint8Array(tx.serialize());
      }
      console.log('[BlockID] encoded type:', encoded?.constructor?.name);
      console.log('[BlockID] encoded instanceof Uint8Array:', encoded instanceof Uint8Array);
      console.log('[BlockID] encoded length:', encoded?.length);
      console.log('[BlockID] activeWallet:', activeWallet?.address, activeWallet?.walletClientType);
      const result = await activeWallet.signAndSendTransaction({
        chain: 'solana:mainnet',
        transaction: encoded,
      });
      console.log('[BlockID] result:', result);
      return result.signature;
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
