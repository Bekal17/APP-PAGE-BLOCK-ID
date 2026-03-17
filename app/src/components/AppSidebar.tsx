import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logo from "@/assets/blockid_logo.svg";
import {
  LayoutDashboard,
  Compass,
  Route,
  Users,
  Fingerprint,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Explore", url: "/explore", icon: Compass },
  { title: "Identity", url: "/identity", icon: Fingerprint },
  { title: "Smart Router", url: "/router", icon: Route },
  { title: "Profile", url: "/profile", icon: Users },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-72 min-h-screen bg-sidebar border-r border-sidebar-border p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 mb-6">
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
    </aside>
  );
};

export default AppSidebar;
