import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { openfortClient } from "@/providers/OpenfortProvider";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        await openfortClient.waitForInitialization();

        // Handle OAuth callback
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

        if (token && userId) {
          await openfortClient.auth.storeCredentials({
            token: decodeURIComponent(token),
            userId: decodeURIComponent(userId),
          });
        }

        await openfortClient.validateAndRefreshToken(true);

        // Configure embedded wallet with Shield
        try {
          const accessToken = await openfortClient.getAccessToken();
          console.log("Access token:", accessToken ? "exists" : "missing");

          // Get encryption session from our backend
          const sessionRes = await fetch(
            import.meta.env.VITE_OPENFORT_ENCRYPTION_SESSION_URL ?? "",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            console.log("Shield session:", sessionData);

            // Configure signer with Shield session
            await openfortClient.embeddedWallet.configure({
              shieldAuthentication: {
                auth: "openfort",
                token: accessToken ?? "",
                encryptionSession: sessionData.session,
                shieldPublishableKey:
                  import.meta.env.VITE_OPENFORT_SHIELD_KEY ?? "",
              },
            });

            // Get wallet address
            const account = await openfortClient.embeddedWallet.get();
            if (account && account.address) {
              console.log("Wallet address:", account.address);
            }
          }
        } catch (walletErr) {
          console.error("Wallet setup error:", walletErr);
        }

        navigate("/", { replace: true });
      } catch (e) {
        console.error("Auth callback error:", e);
        navigate("/", { replace: true });
      }
    };
    void run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400">Setting up your wallet...</p>
      </div>
    </div>
  );
}
