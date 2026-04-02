import './i18n';
import { createRoot } from "react-dom/client";
import { OpenfortProvider } from "@/providers/OpenfortProvider";
import SolanaWalletProvider from "@/components/SolanaWalletProvider";
import App from "./App.tsx";
import "./index.css";

const savedTheme = localStorage.getItem("blockid-theme") ?? "dark";
if (savedTheme === "light") {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(
  <OpenfortProvider>
    <SolanaWalletProvider>
      <App />
    </SolanaWalletProvider>
  </OpenfortProvider>
);
