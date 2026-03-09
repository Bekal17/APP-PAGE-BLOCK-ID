import { useWalletModal } from "@solana/wallet-adapter-react-ui";

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
