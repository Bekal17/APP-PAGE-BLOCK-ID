import DashboardLayout from "@/components/DashboardLayout";
import {
  Users,
  Shield,
  Star,
  TrendingUp,
  MessageSquare,
  Heart,
  Award,
  ExternalLink,
  Search,
} from "lucide-react";

const topWallets = [
  { rank: 1, name: "vitalik.block", score: 97, followers: "12.4K", badge: "Pioneer" },
  { rank: 2, name: "whale.block", score: 94, followers: "8.7K", badge: "Whale" },
  { rank: 3, name: "defi-chad.block", score: 92, followers: "6.2K", badge: "DeFi Pro" },
  { rank: 4, name: "builder.block", score: 89, followers: "4.1K", badge: "Builder" },
  { rank: 5, name: "anon42.block", score: 87, followers: "1.3K", badge: "Verified" },
];

const socialFeed = [
  { user: "whale.block", action: "achieved Trust Score 94", time: "5 min ago", type: "achievement" },
  { user: "builder.block", action: "followed vitalik.block", time: "18 min ago", type: "follow" },
  { user: "defi-chad.block", action: "earned DeFi Pro badge", time: "1 hr ago", type: "badge" },
  { user: "anon42.block", action: "completed 1000th transaction", time: "3 hrs ago", type: "milestone" },
  { user: "vitalik.block", action: "updated profile", time: "6 hrs ago", type: "update" },
];

const badges = [
  { name: "Pioneer", desc: "Early adopter", color: "text-primary" },
  { name: "Whale", desc: ">$1M volume", color: "text-accent" },
  { name: "DeFi Pro", desc: "10+ protocols", color: "text-success" },
  { name: "Verified", desc: "Identity verified", color: "text-primary" },
];

const Social = () => {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Social Layer</h1>
            <p className="text-sm text-muted-foreground mt-1">Discover and connect with trusted wallets</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search wallets..."
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          {badges.map((badge) => (
            <div key={badge.name} className="glass-card-hover p-4 text-center">
              <Award className={`w-6 h-6 mx-auto mb-2 ${badge.color}`} />
              <p className="text-sm font-semibold text-foreground">{badge.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{badge.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Rankings */}
          <div className="glass-card p-6 lg:col-span-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Trust Leaderboard</h3>
            </div>
            <div className="space-y-2">
              {topWallets.map((wallet) => (
                <div key={wallet.rank} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      wallet.rank <= 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {wallet.rank}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        {wallet.name}
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </p>
                      <p className="text-xs text-muted-foreground">{wallet.followers} followers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{wallet.badge}</span>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-success" />
                      <span className="text-sm font-bold text-foreground">{wallet.score}</span>
                    </div>
                    <button className="px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                      Follow
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass-card p-6 lg:col-span-2 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Network Activity</h3>
            </div>
            <div className="space-y-3">
              {socialFeed.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                    item.type === "achievement" ? "bg-success/10" :
                    item.type === "badge" ? "bg-accent/10" :
                    "bg-primary/10"
                  }`}>
                    {item.type === "achievement" ? <Star className="w-3 h-3 text-success" /> :
                     item.type === "badge" ? <Award className="w-3 h-3 text-accent" /> :
                     item.type === "follow" ? <Heart className="w-3 h-3 text-primary" /> :
                     <TrendingUp className="w-3 h-3 text-primary" />}
                  </div>
                  <div>
                    <p className="text-xs text-foreground">
                      <span className="font-semibold">{item.user}</span>{" "}
                      <span className="text-muted-foreground">{item.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Social;
