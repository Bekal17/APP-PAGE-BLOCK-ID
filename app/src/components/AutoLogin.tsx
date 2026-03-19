import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  loginWithSignature,
  getSessionToken,
  clearSessionToken,
} from "@/services/blockidApi";

const AutoLogin = () => {
  const { publicKey, connected, signMessage } = useWallet();

  useEffect(() => {
    if (!connected || !publicKey || !signMessage) return;

    const wallet = publicKey.toBase58();
    const existingToken = getSessionToken();

    // Check if we already have a valid token for this wallet
    if (existingToken) {
      try {
        const payload = JSON.parse(atob(existingToken.split(".")[1]));
        const isExpired = payload.exp < Math.floor(Date.now() / 1000);
        const isCorrectWallet = payload.wallet === wallet;
        if (!isExpired && isCorrectWallet) return; // Token still valid
      } catch {
        // Invalid token, proceed to login
      }
    }

    // Login with signature
    loginWithSignature(wallet, signMessage).catch((err) => {
      console.warn("BlockID login failed:", err);
    });
  }, [connected, publicKey, signMessage]);

  // Clear token on disconnect
  useEffect(() => {
    if (!connected) {
      clearSessionToken();
    }
  }, [connected]);

  return null;
};

export default AutoLogin;
