import { useAuthCallback } from "@openfort/react";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  const hasOpenfortCallback = useMemo(() => {
    try {
      return new URL(window.location.href).searchParams.has("openfortAuthProvider");
    } catch {
      return false;
    }
  }, []);

  useAuthCallback({
    enabled: hasOpenfortCallback,
    recoverWalletAutomatically: true,
    onSuccess: () => navigate("/", { replace: true }),
    onError: (e) => {
      console.error("Auth callback error:", e);
      navigate("/", { replace: true });
    },
  });

  useEffect(() => {
    if (!hasOpenfortCallback) {
      navigate("/", { replace: true });
    }
  }, [hasOpenfortCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400">Setting up your wallet...</p>
      </div>
    </div>
  );
}
