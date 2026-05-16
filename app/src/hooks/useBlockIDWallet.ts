import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useSendTransaction } from '@privy-io/react-auth/solana';
import { PublicKey, Connection } from '@solana/web3.js';
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

  const { sendTransaction: privySendTransaction } = useSendTransaction();

  const signTransaction = useMemo(() => {
    if (!activeWallet) return undefined;
    return async (tx: any) => {
      return await activeWallet.signTransaction(tx);
    };
  }, [activeWallet]);

  // For Privy embedded wallet users — sign + send in one step
  const sendTransaction = useMemo(() => {
    if (!activeWallet) return undefined;
    return async (tx: any, connection: Connection) => {
      const receipt = await privySendTransaction({
        transaction: tx,
        connection,
      });
      return receipt.signature;
    };
  }, [activeWallet, privySendTransaction]);

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
