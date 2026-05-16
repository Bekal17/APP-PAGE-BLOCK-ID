import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useNavigate } from "react-router-dom";
import {
  loginWithSignature,
  getSessionToken,
  clearSessionToken,
  setSessionToken,
} from "@/services/blockidApi";

const API_BASE = import.meta.env.VITE_EXPLORER_API_URL ||
  "https://blockid-backend-production.up.railway.app";

const AutoLogin = () => {
  const { publicKey, connected, signMessage } = useWallet();
  const { authenticated } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const privyLoginDone = useRef(false);

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

  // Privy user: get BlockID session token via embedded-login
  useEffect(() => {
    if (!authenticated || connected) return;

    const privySolanaWallet = privyWallets?.find(
      w => w.type === "solana" || w.walletClientType === "privy"
    ) ?? privyWallets?.[0];

    if (!privySolanaWallet?.address) return;
    if (privyLoginDone.current) return;

    const wallet = privySolanaWallet.address;
    const existingToken = getSessionToken();

    if (existingToken) {
      try {
        const payload = JSON.parse(atob(existingToken.split(".")[1]));
        const isExpired = payload.exp < Math.floor(Date.now() / 1000);
        const isCorrectWallet = payload.wallet === wallet;
        if (!isExpired && isCorrectWallet) {
          privyLoginDone.current = true;
          return;
        }
      } catch {}
    }

    privyLoginDone.current = true;
    fetch(`${API_BASE}/auth/embedded-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        wallet_address: wallet,
        auth_provider: "google",
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.session_token) {
          setSessionToken(data.session_token);
        }
      })
      .catch(err => console.warn("Privy embedded login failed:", err));
  }, [authenticated, connected, privyWallets]);

  // Privy user: redirect to "/" only when coming from /login
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
