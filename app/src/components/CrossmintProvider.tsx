import React from "react";
import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui";

const CROSSMINT_API_KEY = import.meta.env.VITE_CROSSMINT_API_KEY ?? "";

export default function CrossmintAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CrossmintProvider apiKey={CROSSMINT_API_KEY}>
      <CrossmintAuthProvider
        loginMethods={["google", "email"]}
        appearance={{
          borderRadius: "16px",
          colors: {
            background: "#0d1117",
            textPrimary: "#f0f8ff",
            textSecondary: "#94a3b8",
            accent: "#38bdf8",
            buttonBackground: "rgba(56,189,248,0.15)",
            buttonText: "#f0f8ff",
            border: "rgba(56,189,248,0.3)",
            danger: "#f87171",
          },
        }}
      >
        <CrossmintWalletProvider
          createOnLogin={{
            chain: "solana-devnet",
            signer: { type: "email" },
          }}
          showPasskeyHelpers={false}
        >
          {children}
        </CrossmintWalletProvider>
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}
