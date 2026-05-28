import { useCrossmintAuth as useAuth, useWallet as useCrossmintWallet } from '@crossmint/client-sdk-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export function useBlockIDWallet() {
  const { user, logout: crossmintLogout } = useAuth();
  const { wallet: crossmintWallet, status: walletStatus } = useCrossmintWallet();
  const { connected: phantomConnected, publicKey: phantomPublicKey, signTransaction: phantomSignTransaction } = useWallet();

  // Prefer Phantom if connected, fallback to Crossmint embedded wallet
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

  const signTransaction = useMemo(() => {
    if (phantomConnected && phantomSignTransaction) {
      return phantomSignTransaction as (tx: any) => Promise<any>;
    }
    if (crossmintWallet) {
      return async (tx: any) => {
        return await (crossmintWallet as any).signTransaction(tx);
      };
    }
    return undefined;
  }, [phantomConnected, phantomSignTransaction, crossmintWallet]);

  const sendTransaction = useMemo(() => {
    if (!crossmintWallet || phantomConnected) return undefined;
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
      const result = await (crossmintWallet as any).signAndSendTransaction({
        chain: 'solana:mainnet',
        transaction: encoded,
      });
      return result.signature;
    };
  }, [crossmintWallet, phantomConnected]);

  const signMessage = useMemo(() => {
    if (!crossmintWallet || phantomConnected) return undefined;
    return async (message: Uint8Array) => {
      return await (crossmintWallet as any).signMessage(message);
    };
  }, [crossmintWallet, phantomConnected]);

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
    isPrivyWallet: false,
    isCrossmintWallet,
    user,
  };
}
