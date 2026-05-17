import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useSignAndSendTransaction } from '@privy-io/react-auth/solana';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
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

  const { signAndSendTransaction } = useSignAndSendTransaction();

  const sendTransaction = useMemo(() => {
    if (!activeWallet) return undefined;
    return async (tx: any, _connection: any) => {
      let encoded: Uint8Array;
      if (tx instanceof Transaction) {
        encoded = new Uint8Array(tx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }));
      } else {
        encoded = new Uint8Array(tx.serialize());
      }
      const result = await signAndSendTransaction({
        transaction: encoded,
        wallet: activeWallet,
      });
      return Buffer.from(result.signature).toString('base64');
    };
  }, [activeWallet, signAndSendTransaction]);

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
