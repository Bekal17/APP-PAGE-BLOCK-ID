import { ReactNode, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import MobileNav from "@/components/MobileNav";
import GlobalSearch from "@/components/GlobalSearch";
import { Menu } from "lucide-react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with search */}
        <header className="flex items-center gap-4 px-4 md:px-6 lg:px-8 py-3 border-b border-border">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="lg:hidden text-lg font-bold gradient-text">blockID</span>
          <div className="hidden sm:block flex-1">
            <GlobalSearch />
          </div>
        </header>
        {/* Mobile search */}
        <div className="sm:hidden px-4 py-3 border-b border-border">
          <GlobalSearch />
        </div>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
