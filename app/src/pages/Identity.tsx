import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import {
  Fingerprint,
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  UserCircle,
  AtSign,
  Link2,
  Loader2,
} from "lucide-react";

const Identity = () => {
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const handleCheck = () => {
    if (!username) return;
    setChecking(true);
    setTimeout(() => {
      setAvailable(username.length > 3 && !["vitalik", "satoshi", "admin"].includes(username.toLowerCase()));
      setChecking(false);
    }, 800);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Identity Registration</h1>
          <p className="text-sm text-muted-foreground mt-1">Register your human-readable wallet identity</p>
        </div>

        {/* Username Search */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 mb-4">
            <AtSign className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Choose Your Identity</h3>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setAvailable(null); }}
                placeholder="Enter desired username"
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm font-mono"
              />
              {available !== null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {available ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleCheck}
              disabled={!username || checking}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Check
            </button>
          </div>
          {available !== null && (
            <p className={`text-xs mt-2 ${available ? "text-success" : "text-destructive"}`}>
              {available ? `"${username}.trust" is available!` : `"${username}.trust" is already taken.`}
            </p>
          )}
        </div>

        {/* Profile Setup */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-2 mb-6">
            <UserCircle className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Profile Setup</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Display Name</label>
              <input
                type="text"
                placeholder="Your display name"
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Bio</label>
              <textarea
                rows={3}
                placeholder="Tell the network about yourself..."
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Website</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="url"
                  placeholder="https://your-website.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Verification Status</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Wallet Ownership", status: "verified", desc: "Signature verified" },
              { label: "On-chain Activity", status: "verified", desc: "500+ transactions" },
              { label: "Social Verification", status: "pending", desc: "Connect Twitter/X" },
              { label: "KYC (Optional)", status: "not_started", desc: "Institutional grade" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  {item.status === "verified" ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : item.status === "pending" ? (
                    <Loader2 className="w-4 h-4 text-warning animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  item.status === "verified" ? "bg-success/10 text-success" :
                  item.status === "pending" ? "bg-warning/10 text-warning" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {item.status === "verified" ? "Verified" : item.status === "pending" ? "Pending" : "Not Started"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Register Button */}
        <div className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <button className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all glow-border">
            <Fingerprint className="w-4 h-4 inline mr-2" />
            Register Identity
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Identity;
