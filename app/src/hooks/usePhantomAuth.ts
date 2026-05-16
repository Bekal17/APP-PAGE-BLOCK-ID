import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";

export function usePhantomAuth() {
  const { wallets, select, disconnect, connected, publicKey } = useWallet();
  const navigate = useNavigate();

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
    connected,
    publicKey,
  };
}
