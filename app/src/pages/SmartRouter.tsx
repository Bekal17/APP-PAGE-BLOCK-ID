import DashboardLayout from "@/components/DashboardLayout";
import {
  Route,
  Zap,
  ArrowRight,
  Fuel,
  Brain,
  CheckCircle2,
  Settings2,
  RefreshCw,
} from "lucide-react";

const chains = [
  { name: "Ethereum", short: "ETH", active: true, color: "bg-accent" },
  { name: "Polygon", short: "MATIC", active: true, color: "bg-accent" },
  { name: "Arbitrum", short: "ARB", active: true, color: "bg-primary" },
  { name: "Optimism", short: "OP", active: false, color: "bg-destructive" },
  { name: "Base", short: "BASE", active: true, color: "bg-primary" },
  { name: "Solana", short: "SOL", active: false, color: "bg-accent" },
];

const routes = [
  { from: "USDC (Polygon)", to: "USDC (Arbitrum)", fee: "$0.12", savings: "68%", time: "~45s" },
  { from: "ETH (Ethereum)", to: "ETH (Base)", fee: "$0.34", savings: "52%", time: "~2 min" },
  { from: "WBTC (Ethereum)", to: "WBTC (Polygon)", fee: "$0.89", savings: "41%", time: "~3 min" },
];

const SmartRouter = () => {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Smart Router</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-optimized cross-chain asset routing</p>
        </div>

        {/* Network Selection */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Preferred Networks</h3>
            </div>
            <span className="text-xs text-muted-foreground">{chains.filter(c => c.active).length} active</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {chains.map((chain) => (
              <button
                key={chain.name}
                className={`p-3 rounded-lg border text-center transition-all ${
                  chain.active
                    ? "border-primary/40 bg-primary/5 glow-border"
                    : "border-border bg-muted/20 opacity-50"
                }`}
              >
                <div className={`w-8 h-8 mx-auto rounded-full ${chain.color}/20 flex items-center justify-center mb-2`}>
                  <span className="text-xs font-bold text-foreground">{chain.short.slice(0, 2)}</span>
                </div>
                <p className="text-xs font-medium text-foreground">{chain.name}</p>
                {chain.active && <CheckCircle2 className="w-3 h-3 text-primary mx-auto mt-1" />}
              </button>
            ))}
          </div>
        </div>

        {/* Route Preview */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Active Routes</h3>
            </div>
            <button className="text-xs text-primary flex items-center gap-1 hover:underline">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="space-y-3">
            {routes.map((route, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">{route.from}</span>
                  <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">{route.to}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Fee</p>
                    <p className="text-sm font-mono text-foreground">{route.fee}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Savings</p>
                    <p className="text-sm font-semibold text-success">{route.savings}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-sm font-mono text-foreground">{route.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Explanation + Fee Optimization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">AI Routing Logic</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>The AI router analyzes real-time gas prices, bridge liquidity, and historical latency to find optimal paths.</p>
              <div className="p-3 rounded-lg bg-muted/30 font-mono text-xs text-primary">
                <p>→ Polygon selected: lowest gas ($0.001)</p>
                <p>→ Arbitrum bridge: highest liquidity</p>
                <p>→ Route confidence: 97.2%</p>
                <p>→ Estimated savings: $4.28 vs direct</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Fuel className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Fee Optimization</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: "Gas Saved (30d)", value: "$127.40", icon: Zap },
                { label: "Avg. Savings per Txn", value: "54%", icon: Zap },
                { label: "Routes Optimized", value: "342", icon: Route },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="text-sm font-semibold text-foreground">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SmartRouter;
