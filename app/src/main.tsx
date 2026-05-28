import './i18n';
import { createRoot } from "react-dom/client";
import CrossmintAppProvider from "@/components/CrossmintProvider";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";
import App from "./App.tsx";
import "./index.css";

const savedTheme = localStorage.getItem("blockid-theme") ?? "dark";
if (savedTheme === "light") {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.add("dark");
}

const RPC_URL = import.meta.env.VITE_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";
const wallets = [new SolflareWalletAdapter()];

createRoot(document.getElementById("root")!).render(
  <CrossmintAppProvider>
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={(error) => {
          const msg = error?.message ?? "";
          if (
            msg.includes("not iterable") ||
            msg.includes("fall off the curve") ||
            msg.includes("read only property") ||
            msg.includes("WalletNotSelected")
          ) return;
          console.warn("[WalletProvider] error:", error);
        }}
      >
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </CrossmintAppProvider>
);
