import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import {
  loginWithSignature,
  getSessionToken,
  clearSessionToken,
} from "@/services/blockidApi";

const AutoLogin = () => {
  const { publicKey, connected, signMessage } = useWallet();
  const { authenticated } = usePrivy();
  const navigate = useNavigate();

  // Phantom wallet: login with signature
  useEffect(() => {
    if (!connected || !publicKey || !signMessage) return;

    const wallet = publicKey.toBase58();
    const existingToken = getSessionToken();

    if (existingToken) {
      try {
        const payload = JSON.parse(atob(existingToken.split(".")[1]));
        const isExpired = payload.exp < Math.floor(Date.now() / 1000);
        const isCorrectWallet = payload.wallet === wallet;
        if (!isExpired && isCorrectWallet) return;
      } catch {}
    }

    loginWithSignature(wallet, signMessage).catch((err) => {
      console.warn("BlockID login failed:", err);
    });
  }, [connected, publicKey, signMessage]);

  // Phantom: clear token on disconnect
  useEffect(() => {
    if (!connected) {
      clearSessionToken();
    }
  }, [connected]);

  // Privy user: redirect to "/" only when coming from /login
  const hasRedirected = useRef(false);
  useEffect(() => {
    if (authenticated && !hasRedirected.current) {
      if (window.location.pathname === "/login") {
        hasRedirected.current = true;
        navigate("/");
      }
    }
  }, [authenticated, navigate]);

  return null;
};

export default AutoLogin;
