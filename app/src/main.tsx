import './i18n';
import { createRoot } from "react-dom/client";
import SolanaWalletProvider from "@/components/SolanaWalletProvider";
import { PhantomEmbeddedProvider } from "@/providers/PhantomEmbeddedProvider";
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
  <PhantomEmbeddedProvider>
    <SolanaWalletProvider>
      <App />
    </SolanaWalletProvider>
  </PhantomEmbeddedProvider>
);
