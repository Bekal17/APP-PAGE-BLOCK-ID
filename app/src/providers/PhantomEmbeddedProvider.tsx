import type { ReactNode } from "react";
import { PhantomProvider, darkTheme, AddressType } from "@phantom/react-sdk";
import blockidLogo from "@/assets/blockid_logo.svg";

interface PhantomEmbeddedProviderProps {
  children: ReactNode;
}

export function PhantomEmbeddedProvider({
  children,
}: PhantomEmbeddedProviderProps) {
  return (
    <PhantomProvider
      config={{
        providers: ["google", "apple", "injected"],
        appId:
          import.meta.env.VITE_PHANTOM_APP_ID ||
          "d49ec555-756d-4b4f-aba1-46d2627bd038",
        addressTypes: [AddressType.solana],
        authOptions: {
          redirectUrl: "https://app.blockidscore.fun/auth/callback",
        },
      }}
      theme={darkTheme}
      appName="BlockID"
      appIcon={blockidLogo}
    >
      {children}
    </PhantomProvider>
  );
}
