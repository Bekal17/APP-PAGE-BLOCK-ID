import InteractiveWalletGraph from "@/components/InteractiveWalletGraph";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useSearchParams } from "react-router-dom";
import SolanaWalletProvider from "@/components/SolanaWalletProvider";
import Dashboard from "./pages/Dashboard";
import TrustAnalytics from "./pages/TrustAnalytics";
import Identity from "./pages/Identity";
import Explore from "./pages/Explore";
import SmartRouter from "./pages/SmartRouter";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function DashboardBackground() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isAnalytics = location.pathname === "/analytics";

  if (isAnalytics) {
    return null;
  }
  return <InteractiveWalletGraph />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SolanaWalletProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="relative min-h-screen">
          <DashboardBackground />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<TrustAnalytics />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/identity" element={<Identity />} />
            <Route path="/router" element={<SmartRouter />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
    </SolanaWalletProvider>
  </QueryClientProvider>
);

export default App;
