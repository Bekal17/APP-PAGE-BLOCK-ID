import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { openfortClient } from "@/providers/OpenfortProvider";

export default function AuthCallback() {
  const navigate = useNavigate();
  const openfort = openfortClient;

  useEffect(() => {
    const run = async () => {
      await openfort.waitForInitialization();

      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);

      const token =
        params.get("token") ??
        params.get("access_token") ??
        hashParams.get("token") ??
        hashParams.get("access_token");
      const userId =
        params.get("userId") ??
        params.get("user_id") ??
        hashParams.get("userId") ??
        hashParams.get("user_id");

      try {
        if (token && userId) {
          await openfort.auth.storeCredentials({
            token: decodeURIComponent(token),
            userId: decodeURIComponent(userId),
          });
        }
        await openfort.validateAndRefreshToken(true);
        await openfort.user.get();
        navigate("/", { replace: true });
      } catch {
        navigate("/", { replace: true });
      }
    };

    void run();
  }, [navigate, openfort]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400">Completing sign in...</p>
      </div>
    </div>
  );
}
