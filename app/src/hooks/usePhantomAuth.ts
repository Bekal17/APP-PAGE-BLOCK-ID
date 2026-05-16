import { useWallet } from "@solana/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useNavigate } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";

export function usePhantomAuth() {
  const { wallets, select, disconnect, connected, publicKey } = useWallet();
  const { authenticated } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  const navigate = useNavigate();

  // Privy SVM wallet address fallback
  const privySolanaAddress = privyWallets?.find(
    w => w.type === "solana" || w.walletClientType === "privy"
  )?.address ?? privyWallets?.[0]?.address ?? null;

  const privyPublicKey = useMemo(() => {
    if (!privySolanaAddress) return null;
    try { return new PublicKey(privySolanaAddress); } catch { return null; }
  }, [privySolanaAddress]);

  // Use Phantom publicKey if connected, else Privy SVM wallet
  const effectivePublicKey = publicKey ?? privyPublicKey;
  const effectiveConnected = connected || (authenticated && !!privySolanaAddress);

  const connectWallet = (walletName: string) => {
    localStorage.removeItem("blockid_logged_out");
    select(walletName as any);
    navigate("/");
  };

  const disconnectWallet = async () => {
    try { await disconnect(); } catch {}
    sessionStorage.clear();
    localStorage.clear();
    localStorage.setItem("blockid_logged_out", "true");
    window.location.replace("/login");
  };

  const phantomWallet = wallets.find(w =>
    w.adapter.name.toLowerCase().includes("phantom")
  );
  const solflareWallet = wallets.find(w =>
    w.adapter.name.toLowerCase().includes("solflare")
  );
  const backpackWallet = wallets.find(w =>
    w.adapter.name.toLowerCase().includes("backpack")
  );

  return {
    wallets,
    phantomWallet,
    solflareWallet,
    backpackWallet,
    connectWallet,
    disconnectWallet,
    connected: effectiveConnected,
    publicKey: effectivePublicKey,
    address: effectivePublicKey?.toString() ?? null,
  };
}
