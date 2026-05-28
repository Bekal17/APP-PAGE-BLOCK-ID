import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCrossmintAuth as useAuth } from "@crossmint/client-sdk-react-ui";
import { useBlockIDWallet } from "@/hooks/useBlockIDWallet";
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
  const { user } = useAuth();
  const { address: crossmintAddress } = useBlockIDWallet();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const crossmintLoginDone = useRef(false);

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

  // Crossmint user: get BlockID session token via embedded-login
  useEffect(() => {
    if (!user || connected) return;
    if (!crossmintAddress) return;
    if (crossmintLoginDone.current) return;

    const existingToken = getSessionToken();
    if (existingToken) {
      try {
        const payload = JSON.parse(atob(existingToken.split(".")[1]));
        const isExpired = payload.exp < Math.floor(Date.now() / 1000);
        const isCorrectWallet = payload.wallet === crossmintAddress;
        if (!isExpired && isCorrectWallet) {
          crossmintLoginDone.current = true;
          return;
        }
      } catch {}
    }

    crossmintLoginDone.current = true;
    fetch(`${API_BASE}/auth/embedded-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet_address: crossmintAddress,
        auth_provider: "crossmint",
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.session_token) {
          setSessionToken(data.session_token);
        }
      })
      .catch(err => console.warn("Crossmint embedded login failed:", err));
  }, [user, connected, crossmintAddress]);

  useEffect(() => {
    if (user && !hasRedirected.current) {
      if (window.location.pathname === "/login") {
        hasRedirected.current = true;
        navigate("/");
      }
    }
  }, [user, navigate]);

  return null;
};

export default AutoLogin;
