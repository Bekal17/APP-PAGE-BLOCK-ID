import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AutoLogin from "@/components/AutoLogin";
import Dashboard from "./pages/Dashboard";
import Identity from "./pages/Identity";
import Explore from "./pages/Explore";
import SmartRouter from "./pages/SmartRouter";
import Profile from "./pages/Profile";
import Upgrade from "./pages/Upgrade";
import PremiumHub from "./pages/PremiumHub";
import PrivacySettings from "@/pages/settings/Privacy";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Bookmarks from "./pages/Bookmarks";
import PostDetail from "./pages/PostDetail";
import NotFound from "./pages/NotFound";
import AuthCallback from "@/pages/AuthCallback";
import LoginEmail from "@/pages/LoginEmail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AutoLogin />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="relative min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
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
            <Route path="/premium" element={<PremiumHub />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/login-email" element={<LoginEmail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
