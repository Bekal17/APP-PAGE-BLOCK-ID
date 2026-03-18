import { useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logo from "@/assets/blockid_logo.svg";
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
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getDMUnreadCount } from "@/services/blockidApi";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Messages", url: "/messages", icon: MessageCircle },
  { title: "Bookmarks", url: "/bookmarks", icon: Bookmark },
  { title: "Explore", url: "/explore", icon: Compass },
  { title: "Identity", url: "/identity", icon: Fingerprint },
  { title: "Smart Router", url: "/router", icon: Route },
  { title: "Profile", url: "/profile", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const location = useLocation();
  const { publicKey } = useWallet();
  const [dmUnread, setDmUnread] = useState(0);

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
      <div className="px-4 mb-6 flex items-center gap-3">
        <img
          src={logo}
          alt="BlockID"
          className="h-8 w-auto shrink-0"
        />
        <span className="text-lg font-bold tracking-tight">
          <span className="text-white">Block</span>
          <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            ID
          </span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5">
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
              }`}
              activeClassName=""
            >
              <item.icon className="w-4 h-4" />
              <span>{item.title}</span>
              {item.title === "Messages" && dmUnread > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {dmUnread > 9 ? "9+" : dmUnread}
                </span>
              )}
              {isActive && item.title !== "Messages" && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary neon-dot" />
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default AppSidebar;
