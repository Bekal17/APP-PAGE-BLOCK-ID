import { useCrossmintAuth as useAuth, useWallet as useCrossmintWallet } from '@crossmint/client-sdk-react-ui';
import { SolanaWallet } from '@crossmint/wallets-sdk';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Buffer } from 'buffer';

export function useBlockIDWallet() {
  const { user, logout: crossmintLogout } = useAuth();
  const { wallet: crossmintWallet, status: walletStatus } = useCrossmintWallet();
  const {
    connected: phantomConnected,
    publicKey: phantomPublicKey,
    signTransaction: phantomSignTransaction,
  } = useWallet();

  const isCrossmintWallet = !phantomConnected && !!crossmintWallet;
  const ready = walletStatus !== 'in-progress';

  const address = useMemo(() => {
    if (phantomConnected && phantomPublicKey) return phantomPublicKey.toString();
    if (crossmintWallet?.address) return crossmintWallet.address;
    return null;
  }, [phantomConnected, phantomPublicKey, crossmintWallet?.address]);

  const publicKey = useMemo(() => {
    if (!address) return null;
    try { return new PublicKey(address); } catch { return null; }
  }, [address]);

  const connected = phantomConnected || !!crossmintWallet;

  // signTransaction: only for Phantom users
  // Crossmint users use sendTransaction which handles sign+send in one call
  const signTransaction = useMemo(() => {
    if (phantomConnected && phantomSignTransaction) {
      return phantomSignTransaction as (tx: any) => Promise<any>;
    }
    // Crossmint does not support client-side signTransaction
    return undefined;
  }, [phantomConnected, phantomSignTransaction]);

  // sendTransaction: for Crossmint users - sign+send in one server-side call
  const sendTransaction = useMemo(() => {
    if (!isCrossmintWallet || !crossmintWallet) return undefined;
    return async (tx: Transaction | any, _connection: any): Promise<string> => {
      const solWallet = SolanaWallet.from(crossmintWallet as any);
      let serialized: string;
      if (tx instanceof Transaction) {
        serialized = Buffer.from(
          tx.serialize({ requireAllSignatures: false, verifySignatures: false })
        ).toString('base64');
      } else if (tx instanceof Uint8Array) {
        serialized = Buffer.from(tx).toString('base64');
      } else {
        serialized = Buffer.from(tx.serialize()).toString('base64');
      }
      const result = await solWallet.sendTransaction({
        serializedTransaction: serialized,
      }) as any;
      return result.txId ?? result.signature ?? result.hash ?? result.transactionId ?? '';
    };
  }, [isCrossmintWallet, crossmintWallet]);

  const signMessage = useMemo(() => {
    if (phantomConnected) return undefined;
    if (!crossmintWallet) return undefined;
    return async (message: Uint8Array): Promise<Uint8Array> => {
      const solWallet = SolanaWallet.from(crossmintWallet as any);
      const result = await (solWallet as any).signMessage({ message: Buffer.from(message).toString('base64') });
      return new Uint8Array(Buffer.from(result.signature, 'base64'));
    };
  }, [phantomConnected, crossmintWallet]);

  const disconnect = async () => {
    if (isCrossmintWallet) {
      await crossmintLogout();
    }
  };

  const select = (_name: string) => {};

  return {
    publicKey,
    connected,
    disconnect,
    signTransaction,
    signMessage,
    sendTransaction,
    wallets: [],
    select,
    ready,
    address,
    isCrossmintWallet,
    user,
  };
}
