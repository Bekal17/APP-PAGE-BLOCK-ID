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
        const user = await openfort.user.get();
        console.log("Openfort user:", JSON.stringify(user, null, 2));

        // Also check embedded wallet
        try {
          const embeddedState = await openfort.embeddedWallet.getEmbeddedState();
          console.log("Embedded wallet state:", embeddedState);

          const accounts = await openfort.embeddedWallet.get();
          console.log("Embedded wallet accounts:", JSON.stringify(accounts, null, 2));
        } catch (e) {
          console.log("Embedded wallet error:", e);
        }

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
