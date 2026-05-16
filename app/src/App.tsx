import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AutoLogin from "@/components/AutoLogin";
import PrivateRoute from "@/components/PrivateRoute";
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
import Communities from "./pages/Communities";
import CommunityFeed from "./pages/CommunityFeed";
import NotFound from "./pages/NotFound";
import Login from "@/pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AutoLogin />
        <div className="relative min-h-screen w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/explore" element={<PrivateRoute><Explore /></PrivateRoute>} />
            <Route path="/identity" element={<PrivateRoute><Identity /></PrivateRoute>} />
            <Route path="/router" element={<SmartRouter />} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/profile/:walletParam" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
            <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
            <Route path="/messages/:walletParam" element={<PrivateRoute><Messages /></PrivateRoute>} />
            <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
            <Route path="/communities" element={<PrivateRoute><Communities /></PrivateRoute>} />
            <Route
              path="/communities/:collectionAddress"
              element={<PrivateRoute><CommunityFeed /></PrivateRoute>}
            />
            <Route path="/post/:postId" element={<PostDetail />} />
            <Route path="/settings" element={<PrivateRoute><PrivacySettings /></PrivateRoute>} />
            <Route path="/settings/privacy" element={<PrivateRoute><PrivacySettings /></PrivateRoute>} />
            <Route path="/upgrade" element={<PrivateRoute><Upgrade /></PrivateRoute>} />
            <Route path="/premium" element={<PrivateRoute><PremiumHub /></PrivateRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
