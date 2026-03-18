import { ReactNode, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import logo from "@/assets/blockid_logo.svg";
import MobileNav from "@/components/MobileNav";
import WalletIndicator from "@/components/WalletIndicator";
import NotificationBell from "@/components/NotificationBell";
import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 border-r border-zinc-800 bg-zinc-950 z-40 flex flex-col overflow-y-auto">
        <AppSidebar />
      </div>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-zinc-800 bg-zinc-950 flex items-center gap-4 px-6">
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center min-w-[240px] lg:hidden">
              <img
                src={logo}
                alt="BlockID"
                className="h-16 w-auto object-contain shrink-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto shrink-0">
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                title={
                  theme === "dark"
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
                }
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <WalletIndicator />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto pt-14">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
