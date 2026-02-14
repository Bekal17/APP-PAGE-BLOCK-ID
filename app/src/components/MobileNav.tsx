import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  LayoutDashboard,
  Shield,
  Fingerprint,
  Route,
  Users,
  X,
  Activity,
  Wallet,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Trust Analytics", url: "/analytics", icon: Shield },
  { title: "Identity", url: "/identity", icon: Fingerprint },
  { title: "Smart Router", url: "/router", icon: Route },
  { title: "Social", url: "/social", icon: Users },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const formatSolanaAddress = (address: string) => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const MobileNav = ({ open, onClose }: MobileNavProps) => {
  const location = useLocation();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const displayAddress = publicKey ? formatSolanaAddress(publicKey.toBase58()) : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border p-4 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 px-3">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold gradient-text">blockID</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <NavLink
                key={item.url}
                to={item.url}
                end
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
                activeClassName=""
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-4 pt-4 border-t border-sidebar-border">
          {connected && displayAddress ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-sidebar-accent/50">
              <UserCircle className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate font-mono">{displayAddress}</p>
                <p className="text-xs text-muted-foreground">Solana</p>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => { setVisible(true); onClose(); }}
              variant="outline"
              className="w-full gap-2"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
};

export default MobileNav;
