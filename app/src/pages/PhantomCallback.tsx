import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePhantom, useDisconnect, AddressType } from "@phantom/react-sdk";
import { useToast } from "@/hooks/use-toast";

const API_BASE =
  import.meta.env.VITE_SOCIAL_API_URL ??
  "https://blockid-backend-production.up.railway.app";

const BLOCKID_SESSION_TOKEN_KEY = "blockid_session_token";
const BLOCKID_EMBEDDED_WALLET_KEY = "blockid_embedded_wallet";
const BLOCKID_AUTH_TYPE_KEY = "blockid_auth_type";
const RETRY_INTERVAL_MS = 500;
const RETRY_TIMEOUT_MS = 10_000;

export function useEmbeddedLogout() {
  const { disconnect } = useDisconnect();

  return async () => {
    localStorage.removeItem(BLOCKID_SESSION_TOKEN_KEY);
    localStorage.removeItem(BLOCKID_EMBEDDED_WALLET_KEY);
    localStorage.removeItem(BLOCKID_AUTH_TYPE_KEY);
    await disconnect();
  };
}

export default function PhantomCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isConnected, addresses, isLoading } = usePhantom();
  const [retryTick, setRetryTick] = useState(0);
  const retryStartRef = useRef<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    const hasAuthParams =
      params.toString().length > 0 || hashParams.toString().length > 0;
    const hasAuthCode =
      params.has("code") ||
      params.has("access_token") ||
      params.has("token") ||
      hashParams.has("code") ||
      hashParams.has("access_token") ||
      hashParams.has("token");
    const embeddedWallet = localStorage.getItem(BLOCKID_EMBEDDED_WALLET_KEY);

    console.log("PhantomCallback: isConnected=" + isConnected);
    console.log("PhantomCallback: addresses=" + JSON.stringify(addresses));
    console.log("PhantomCallback: isLoading=" + isLoading);
    console.log("PhantomCallback: hasAuthParams=" + hasAuthParams);

    if (embeddedWallet) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!hasAuthParams && !isConnected && !isLoading) {
      toast({
        title: "Authentication callback is missing required parameters.",
        variant: "destructive",
      });
      navigate("/", { replace: true });
      return;
    }

    if (isConnected) {
      retryStartRef.current = null;
      const solAddress = addresses?.find(
        (addr) => addr.addressType === AddressType.solana,
      )?.address;
      if (solAddress) {
        void (async () => {
          try {
            const response = await fetch(`${API_BASE}/auth/embedded-login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                wallet_address: solAddress,
                auth_provider: "google",
              }),
            });

            const data = await response.json();

            if (data.success && data.session_token) {
              localStorage.setItem(BLOCKID_SESSION_TOKEN_KEY, data.session_token);
              localStorage.setItem(
                BLOCKID_EMBEDDED_WALLET_KEY,
                data.wallet_address,
              );
              localStorage.setItem(BLOCKID_AUTH_TYPE_KEY, "embedded");
              navigate("/dashboard", { replace: true });
              return;
            }

            toast({
              title: "Embedded login failed. Please try again.",
              variant: "destructive",
            });
            navigate("/", { replace: true });
          } catch (err) {
            console.error("Embedded login request failed:", err);
            toast({
              title: "Embedded login failed. Please try again.",
              variant: "destructive",
            });
            navigate("/", { replace: true });
          }
        })();
        return;
      }
      toast({
        title: "Wallet connected but no Solana address was found.",
        variant: "destructive",
      });
      navigate("/", { replace: true });
      return;
    }

    if (!isConnected && hasAuthCode) {
      if (retryStartRef.current === null) {
        retryStartRef.current = Date.now();
      }

      const elapsed = Date.now() - retryStartRef.current;
      if (elapsed >= RETRY_TIMEOUT_MS) {
        toast({
          title: "Authentication failed. Please try again.",
          variant: "destructive",
        });
        navigate("/", { replace: true });
        return;
      }

      const timer = window.setTimeout(() => {
        setRetryTick((n) => n + 1);
      }, RETRY_INTERVAL_MS);
      return () => window.clearTimeout(timer);
    }
  }, [addresses, isConnected, isLoading, navigate, retryTick, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400">Completing Phantom sign in...</p>
      </div>
    </div>
  );
}
