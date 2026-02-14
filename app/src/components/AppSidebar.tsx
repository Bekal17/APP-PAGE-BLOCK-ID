import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  LayoutDashboard,
  Shield,
  UserCircle,
  Route,
  Users,
  Activity,
  Fingerprint,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Trust Analytics", url: "/analytics", icon: Shield },
  { title: "Identity", url: "/identity", icon: Fingerprint },
  { title: "Smart Router", url: "/router", icon: Route },
  { title: "Social", url: "/social", icon: Users },
];

const formatSolanaAddress = (address: string) => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const AppSidebar = () => {
  const location = useLocation();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const displayAddress = publicKey ? formatSolanaAddress(publicKey.toBase58()) : null;

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-sidebar border-r border-sidebar-border p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-border">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <span className="text-lg font-bold gradient-text tracking-tight">blockID</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              activeClassName=""
            >
              <item.icon className="w-4 h-4" />
              <span>{item.title}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary neon-dot" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer - Wallet */}
      <div className="glass-card p-3 mt-4">
        {connected && displayAddress ? (
          <button
            onClick={() => setVisible(true)}
            className="flex items-center gap-2 w-full text-left rounded-lg hover:bg-muted/50 transition-colors p-1 -m-1"
            title="Change wallet"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <UserCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate font-mono">{displayAddress}</p>
              <p className="text-xs text-muted-foreground">Solana • Click to change</p>
            </div>
          </button>
        ) : (
          <Button
            onClick={() => setVisible(true)}
            variant="outline"
            className="w-full gap-2"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </Button>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
