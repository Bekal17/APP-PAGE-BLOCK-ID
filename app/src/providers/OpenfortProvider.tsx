import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Openfort, OpenfortConfiguration } from "@openfort/openfort-js";

const openfort = new Openfort({
  baseConfiguration: new OpenfortConfiguration({
    publishableKey: import.meta.env.VITE_OPENFORT_PUBLISHABLE_KEY ?? "",
  }),
  shieldConfiguration: {
    shieldPublishableKey: import.meta.env.VITE_OPENFORT_SHIELD_KEY ?? "",
  },
});

interface OpenfortContextType {
  openfort: Openfort;
  openfortUser: unknown | null;
  openfortAddress: string | null;
  openfortLoading: boolean;
  signOut: () => Promise<void>;
}

const OpenfortContext = createContext<OpenfortContextType | null>(null);

export function OpenfortProvider({ children }: { children: ReactNode }) {
  const [openfortUser, setOpenfortUser] = useState<unknown | null>(null);
  const [openfortAddress, setOpenfortAddress] = useState<string | null>(null);
  const [openfortLoading, setOpenfortLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await openfort.waitForInitialization();
        const user = await openfort.user.get();
        setOpenfortUser(user);

        // Try to get wallet address
        try {
          const account = await openfort.embeddedWallet.get();
          if (account && account.address) {
            setOpenfortAddress(account.address ?? null);
            console.log("Openfort address:", account.address);
          }
        } catch {
          // Wallet not configured yet
        }
      } catch {
        setOpenfortUser(null);
      } finally {
        setOpenfortLoading(false);
      }
    };
    void init();
  }, []);

  const signOut = async () => {
    await openfort.auth.logout();
    setOpenfortUser(null);
    setOpenfortAddress(null);
  };

  return (
    <OpenfortContext.Provider
      value={{
        openfort,
        openfortUser,
        openfortAddress,
        openfortLoading,
        signOut,
      }}
    >
      {children}
    </OpenfortContext.Provider>
  );
}

export function useOpenfort() {
  const ctx = useContext(OpenfortContext);
  if (!ctx) throw new Error("useOpenfort must be used within OpenfortProvider");
  return ctx;
}

export { openfort as openfortClient };
