import type { ReactNode } from "react";
import {
  OpenfortProvider as OpenfortReactProvider,
  AuthProvider,
  RecoveryMethod,
  ChainTypeEnum,
} from "@openfort/react";
import { useOpenfortStore } from "@/stores/openfortStore";

const PUBLISHABLE_KEY = import.meta.env.VITE_OPENFORT_PUBLISHABLE_KEY ?? "";
const SHIELD_KEY = import.meta.env.VITE_OPENFORT_SHIELD_KEY ?? "";

export function OpenfortProvider({ children }: { children: ReactNode }) {
  return (
    <OpenfortReactProvider
      publishableKey={PUBLISHABLE_KEY}
      walletConfig={{
        shieldPublishableKey: SHIELD_KEY,
        chainType: ChainTypeEnum.SVM,
        solana: { cluster: "mainnet-beta" },
        connectOnLogin: true,
      }}
      uiConfig={{
        authProviders: [AuthProvider.GOOGLE, AuthProvider.EMAIL_OTP],
        walletRecovery: {
          defaultMethod: RecoveryMethod.AUTOMATIC,
        },
      }}
      onConnect={({ address }) => {
        useOpenfortStore.getState().setOpenfortAddress(address ?? null);
        console.log("Openfort wallet connected:", address);
      }}
      onDisconnect={() => {
        useOpenfortStore.getState().setOpenfortAddress(null);
      }}
    >
      {children}
    </OpenfortReactProvider>
  );
}
