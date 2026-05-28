import React from "react";
// SolanaWalletProvider deprecated - replaced by CrossmintProvider in main.tsx
export default function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
