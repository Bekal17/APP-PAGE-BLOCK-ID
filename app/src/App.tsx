import InteractiveWalletGraph from "@/components/InteractiveWalletGraph";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useSearchParams } from "react-router-dom";
import SolanaWalletProvider from "@/components/SolanaWalletProvider";
import AutoLogin from "@/components/AutoLogin";
import Dashboard from "./pages/Dashboard";
import TrustAnalytics from "./pages/TrustAnalytics";
import Identity from "./pages/Identity";
import Explore from "./pages/Explore";
import SmartRouter from "./pages/SmartRouter";
import Profile from "./pages/Profile";
import Upgrade from "./pages/Upgrade";
import PrivacySettings from "@/pages/settings/Privacy";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Bookmarks from "./pages/Bookmarks";
import PostDetail from "./pages/PostDetail";
import NotFound from "./pages/NotFound";
import AuthCallback from "@/pages/AuthCallback";
import LoginEmail from "@/pages/LoginEmail";

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
    <AutoLogin />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="relative min-h-screen">
          <DashboardBackground />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<TrustAnalytics />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/identity" element={<Identity />} />
            <Route path="/router" element={<SmartRouter />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:walletParam" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:walletParam" element={<Messages />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/post/:postId" element={<PostDetail />} />
            <Route path="/settings" element={<PrivacySettings />} />
            <Route path="/settings/privacy" element={<PrivacySettings />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/login-email" element={<LoginEmail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
    </SolanaWalletProvider>
  </QueryClientProvider>
);

export default App;
