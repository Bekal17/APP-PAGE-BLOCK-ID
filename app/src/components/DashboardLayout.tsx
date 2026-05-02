import { ReactNode, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import logo from "/blockid-logo.svg";
import blockidIcon from "@/assets/BLOCKID_LOGO_NEW1.png";
import MobileNav from "@/components/MobileNav";
import WalletIndicator from "@/components/WalletIndicator";
import NotificationBell from "@/components/NotificationBell";
import { Menu, Sun, Moon, Zap } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWallet } from "@solana/wallet-adapter-react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const sub = useSubscription();
  const navigate = useNavigate();
  const { connected } = useWallet();

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
            <div className="flex items-center lg:hidden">
              <img
                src={blockidIcon}
                alt="BlockID"
                className="h-11 w-11 object-contain shrink-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto shrink-0">
            <div className="flex items-center gap-2">
              {connected && (!sub.loading && sub.plan === "free") && (
                <button
                  onClick={() => navigate("/upgrade")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
      bg-gradient-to-r from-amber-500/20 to-orange-500/20
      border border-amber-500/30 hover:border-amber-500/60
      text-amber-400 text-xs font-bold transition-all
      hover:shadow-lg hover:shadow-amber-500/20
      group"
                >
                  <Zap className="w-3 h-3 group-hover:fill-amber-400 transition-all" />
                  {t("nav.upgrade")}
                </button>
              )}
              <NotificationBell />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                title={
                  theme === "dark"
                    ? t("settings.switch_to_light")
                    : t("settings.switch_to_dark")
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
