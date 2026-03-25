import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Openfort, {
  OpenfortConfiguration,
  OAuthProvider,
} from "@openfort/openfort-js";

function createOpenfortClient() {
  const publishableKey = import.meta.env.VITE_OPENFORT_PUBLISHABLE_KEY ?? "";
  return new Openfort({
    baseConfiguration: new OpenfortConfiguration({ publishableKey }),
  });
}

export const openfortClient = createOpenfortClient();

interface OpenfortContextType {
  openfort: Openfort;
  openfortUser: unknown | null;
  openfortLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const OpenfortContext = createContext<OpenfortContextType | null>(null);

export function OpenfortProvider({ children }: { children: ReactNode }) {
  const [openfortUser, setOpenfortUser] = useState<unknown | null>(null);
  const [openfortLoading, setOpenfortLoading] = useState(true);
  const openfort = openfortClient;

  useEffect(() => {
    const load = async () => {
      try {
        await openfort.waitForInitialization();
        const user = await openfort.user.get();
        setOpenfortUser(user);
      } catch {
        setOpenfortUser(null);
      } finally {
        setOpenfortLoading(false);
      }
    };
    void load();
  }, [openfort]);

  const signInWithGoogle = async () => {
    await openfort.waitForInitialization();
    const url = await openfort.auth.initOAuth({
      provider: OAuthProvider.GOOGLE,
      redirectTo: `${window.location.origin}/auth/callback`,
      options: { skipBrowserRedirect: true },
    });
    if (url) window.location.assign(url);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await openfort.waitForInitialization();
    const res = await openfort.auth.logInWithEmailPassword({ email, password });
    setOpenfortUser(res.user as Record<string, unknown>);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await openfort.waitForInitialization();
    const res = await openfort.auth.signUpWithEmailPassword({
      email,
      password,
      name: email.split("@")[0],
      callbackURL: `${window.location.origin}/auth/callback`,
    });
    if (res && typeof res === "object" && "action" in res) {
      return;
    }
    const authRes = res as { user?: unknown };
    if (authRes.user) setOpenfortUser(authRes.user);
  };

  const signOut = async () => {
    await openfort.waitForInitialization();
    await openfort.auth.logout();
    setOpenfortUser(null);
  };

  return (
    <OpenfortContext.Provider
      value={{
        openfort,
        openfortUser,
        openfortLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
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
