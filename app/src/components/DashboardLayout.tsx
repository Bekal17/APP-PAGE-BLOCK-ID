import { ReactNode, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import logo from "@/assets/blockid_logo.svg";
import MobileNav from "@/components/MobileNav";
import WalletIndicator from "@/components/WalletIndicator";
import { Menu } from "lucide-react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center h-20 gap-4 px-4 md:px-6 lg:px-8 border-b border-border">
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
            <WalletIndicator />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
