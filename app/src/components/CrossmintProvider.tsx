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
      >
        <CrossmintWalletProvider
          createOnLogin={{
            chain: "solana-devnet",
            recovery: { type: "email" },
          }}
        >
          {children}
        </CrossmintWalletProvider>
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}
