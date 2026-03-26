import { useState } from "react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { OAuthProvider } from "@openfort/openfort-js";
import { openfortClient, useOpenfort } from "@/providers/OpenfortProvider";

const FEATURES = [
  {
    icon: "🕸",
    title: "Scam Cluster Detection",
    desc: "Detect wallets linked to scam networks and drainer clusters.",
  },
  {
    icon: "🔗",
    title: "Network Risk Analysis",
    desc: "Map counterparty exposure and propagation signals across the network.",
  },
  {
    icon: "🪙",
    title: "Suspicious Token Detection",
    desc: "Identify rug pulls, honeypots, and risky token interactions.",
  },
  {
    icon: "🤖",
    title: "AI Trust Score",
    desc: "ML-powered trust scoring based on on-chain behavior patterns.",
  },
];

export default function DashboardOnboarding() {
  const { setVisible } = useWalletModal();
  const { openfortLoading } = useOpenfort();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  return (
    <div className="w-full max-w-screen-2xl mx-auto p-8">
      {/* Header - shown only when wallet not connected */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Wallet Safety</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Is my wallet safe? Here&apos;s what you need to know.
        </p>
      </div>

      {/* Hero Connect Section */}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/60 backdrop-blur p-10 text-center shadow-[0_0_40px_rgba(34,211,238,0.15)]">
        <div className="text-4xl mb-4">🛡</div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          AI-Powered Wallet Safety Intelligence
        </h1>
        <p className="text-slate-400 mb-6 max-w-xl mx-auto">
          Analyze trust score, scam exposure and network risk using on-chain analytics.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="px-6 py-3 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          Connect Wallet
        </button>
        <div className="mt-4 text-sm text-slate-500">
          Supports Phantom • Backpack • Solflare
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900/60 px-2 text-zinc-500">or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              await openfortClient.waitForInitialization();
              const url = await openfortClient.auth.initOAuth({
                provider: OAuthProvider.GOOGLE,
                redirectTo: `${window.location.origin}/auth/callback`,
                options: { skipBrowserRedirect: true },
              });
              if (url) window.location.assign(url);
            } catch (e) {
              console.error("Google login error:", e);
            }
          }}
          disabled={openfortLoading || authBusy}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="mt-4 space-y-2 text-left max-w-sm mx-auto">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-500"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-200 placeholder:text-zinc-500"
          />
          {authError && (
            <p className="text-xs text-red-400 text-center">{authError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={openfortLoading || authBusy}
              onClick={async () => {
                setAuthError(null);
                setAuthBusy(true);
                try {
                  await openfortClient.waitForInitialization();
                  await openfortClient.auth.logInWithEmailPassword({
                    email,
                    password,
                  });
                } catch {
                  setAuthError("Sign in failed. Check your email and password.");
                } finally {
                  setAuthBusy(false);
                }
              }}
              className="flex-1 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Sign in with email
            </button>
            <button
              type="button"
              disabled={openfortLoading || authBusy}
              onClick={async () => {
                setAuthError(null);
                setAuthBusy(true);
                try {
                  await openfortClient.waitForInitialization();
                  await openfortClient.auth.signUpWithEmailPassword({
                    email,
                    password,
                    name: email.split("@")[0],
                  });
                } catch {
                  setAuthError("Sign up failed. You may need to verify your email.");
                } finally {
                  setAuthBusy(false);
                }
              }}
              className="flex-1 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-sm font-medium text-zinc-100 hover:bg-zinc-600 disabled:opacity-50"
            >
              Create account
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 hover:border-cyan-500/40 transition-colors"
          >
            <div className="text-xl mb-2">{f.icon}</div>
            <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Example Analytics Section */}
      <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
        <h2 className="text-lg font-semibold text-foreground mb-6">Example Wallet Analysis</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center h-40 w-40 rounded-full border-4 border-cyan-500 text-3xl font-bold text-foreground shadow-[0_0_30px_rgba(34,211,238,0.4)]">
              78
            </div>
            <span className="text-sm text-slate-400">Trust Score</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-40 w-40 rounded-xl border border-slate-700 bg-slate-800/50 flex items-center justify-center">
              <span className="text-slate-400 text-sm">Risk Exposure Radar</span>
            </div>
            <span className="text-sm text-slate-400">6 vectors</span>
          </div>
        </div>
        <p className="text-center text-slate-500 text-sm mt-6">
          Example analytics preview. Connect your wallet to see your own results.
        </p>
      </div>

      {/* Supported Wallets */}
      <div className="flex flex-wrap justify-center gap-6 mt-10 text-slate-400 text-sm">
        <span>👻 Phantom</span>
        <span>🎒 Backpack</span>
        <span>☀️ Solflare</span>
      </div>

      {/* Security Message */}
      <p className="text-center text-xs text-slate-500 mt-6">
        BlockID never requests private keys. We only analyze public blockchain data.
      </p>
    </div>
  );
}
