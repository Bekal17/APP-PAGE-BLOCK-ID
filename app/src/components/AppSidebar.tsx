import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logo from "/blockid-logo.svg";
import {
  LayoutDashboard,
  Bell,
  MessageCircle,
  Bookmark,
  Compass,
  Route,
  Users,
  Fingerprint,
  Settings,
  Zap,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getDMUnreadCount } from "@/services/blockidApi";
import QuotaIndicator from "@/components/blockid/QuotaIndicator";

const navItems = [
  { titleKey: "nav.dashboard", url: "/", icon: LayoutDashboard },
  { titleKey: "nav.notifications", url: "/notifications", icon: Bell },
  { titleKey: "nav.messages", url: "/messages", icon: MessageCircle },
  { titleKey: "nav.bookmarks", url: "/bookmarks", icon: Bookmark },
  { titleKey: "nav.explore", url: "/explore", icon: Compass },
  { titleKey: "nav.trust_analytics", url: "/analytics", icon: Fingerprint },
  { titleKey: "nav.smart_router", url: "/router", icon: Route },
  { titleKey: "nav.profile", url: "/profile", icon: Users },
  { titleKey: "nav.upgrade", url: "/upgrade", icon: Zap, highlight: true },
  { titleKey: "nav.settings", url: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const location = useLocation();
  const { publicKey } = useWallet();
  const [dmUnread, setDmUnread] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const wallet = publicKey?.toString();
    if (!wallet) return;

    const fetch = async () => {
      try {
        const data = await getDMUnreadCount(wallet);
        setDmUnread(data.unread_count ?? 0);
      } catch {
        // ignore
      }
    };

    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [publicKey]);

  return (
    <div className="flex flex-col h-full py-4">
      {/* Logo */}
      <div className="px-4 mb-6">
        <img
          src={logo}
          alt="BlockID"
          className="h-24 w-auto shrink-0"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-auto min-h-0">
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
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
              } ${item.highlight ? "text-amber-400 font-bold" : ""}`}
              activeClassName=""
            >
              <item.icon className="w-4 h-4" />
              <span>{t(item.titleKey)}</span>
              {item.url === "/messages" && dmUnread > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {dmUnread > 9 ? "9+" : dmUnread}
                </span>
              )}
              {isActive && item.url !== "/messages" && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary neon-dot" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Quota indicator + Legal links - pinned to bottom */}
      <div className="mt-auto shrink-0 flex flex-col">
        <QuotaIndicator />
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a
            href="https://blockidscore.fun/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Terms
          </a>
          <a
            href="https://blockidscore.fun/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Privacy
          </a>
          <a
            href="https://blockidscore.fun/refund.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Refund
          </a>
          </div>
          <p className="text-xs text-zinc-600 mt-2">© 2026 BlockID</p>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
