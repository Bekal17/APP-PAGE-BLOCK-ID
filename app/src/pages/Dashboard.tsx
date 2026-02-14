import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import DashboardLayout from "@/components/DashboardLayout";
import TrustScoreRing from "@/components/TrustScoreRing";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  TrendingUp,
  Users,
  Wallet,
  Activity,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const reputationData = [
  { month: "Jul", score: 62 },
  { month: "Aug", score: 68 },
  { month: "Sep", score: 71 },
  { month: "Oct", score: 69 },
  { month: "Nov", score: 76 },
  { month: "Dec", score: 82 },
  { month: "Jan", score: 87 },
];

const emptyReputationData = [
  { month: "Jul", score: 0 },
  { month: "Aug", score: 0 },
  { month: "Sep", score: 0 },
  { month: "Oct", score: 0 },
  { month: "Nov", score: 0 },
  { month: "Dec", score: 0 },
  { month: "Jan", score: 0 },
];

const activityFeed = [
  { type: "send", label: "Sent 2.5 ETH", time: "12 min ago", status: "completed" },
  { type: "receive", label: "Received 1,200 USDC", time: "3 hrs ago", status: "completed" },
  { type: "swap", label: "Swapped WBTC → ETH", time: "8 hrs ago", status: "completed" },
  { type: "interact", label: "Interacted with Aave v3", time: "1 day ago", status: "completed" },
  { type: "flag", label: "Risk flag cleared", time: "3 days ago", status: "resolved" },
];

const stats = [
  { label: "Total Txns", value: "2,847", change: "+12.3%", up: true, icon: Activity },
  { label: "Volume (30d)", value: "$1.2M", change: "+8.7%", up: true, icon: TrendingUp },
  { label: "Followers", value: "1,284", change: "+24", up: true, icon: Users },
  { label: "Trust Rank", value: "#847", change: "+126", up: true, icon: Shield },
];

const formatSolanaAddress = (address: string) => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const Dashboard = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const address = publicKey?.toBase58();
  const displayAddress = address ? formatSolanaAddress(address) : null;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Wallet Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor your on-chain identity and trust metrics</p>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Shield className="w-3 h-3" /> Solana
                </span>
                <Button variant="outline" size="sm" onClick={() => disconnect()} className="text-xs">
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setVisible(true)}
                className="gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        {/* Wallet Identity + Trust Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {/* Wallet Card */}
          <div className="glass-card p-6 lg:col-span-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">
                  {connected ? displayAddress : "No wallet connected"}
                </h2>
                <p className="text-xs text-muted-foreground font-mono truncate" title={address || undefined}>
                  {address || "—"}
                </p>
              </div>
            </div>
            <div className="flex justify-center py-4">
              <TrustScoreRing score={connected ? 87 : 0} />
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="stat-label">Wallet Age</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{connected ? "3.2 years" : "—"}</p>
                </div>
                <div>
                  <p className="stat-label">Network</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{connected ? "Solana" : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card-hover p-5">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  {connected && (
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${stat.up ? "text-success" : "text-destructive"}`}>
                      {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="stat-value">{connected ? stat.value : "0"}</p>
                <p className="stat-label mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {/* Reputation Chart */}
          <div className="glass-card p-6 lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Reputation Timeline</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Trust score over last 7 months</p>
              </div>
              <span className="text-xs text-primary font-medium flex items-center gap-1 cursor-pointer hover:underline">
                View Details <ExternalLink className="w-3 h-3" />
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={connected ? reputationData : emptyReputationData}>
                  <defs>
                    <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(185, 80%, 55%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(185, 80%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 20%, 12%)",
                      border: "1px solid hsl(222, 15%, 22%)",
                      borderRadius: "8px",
                      color: "hsl(210, 20%, 92%)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(185, 80%, 55%)"
                    strokeWidth={2}
                    fill="url(#trustGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {(connected ? activityFeed : []).map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${
                    item.status === "resolved" ? "bg-warning/10" : "bg-primary/10"
                  }`}>
                    {item.status === "resolved" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {item.time}
                    </p>
                  </div>
                </div>
              ))}
              {!connected && (
                <p className="text-sm text-muted-foreground py-8 text-center">Connect your Solana wallet to see activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
