import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SolanaWalletProvider from "@/components/SolanaWalletProvider";
import Dashboard from "./pages/Dashboard";
import TrustAnalytics from "./pages/TrustAnalytics";
import Identity from "./pages/Identity";
import SmartRouter from "./pages/SmartRouter";
import Social from "./pages/Social";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SolanaWalletProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<TrustAnalytics />} />
          <Route path="/identity" element={<Identity />} />
          <Route path="/router" element={<SmartRouter />} />
          <Route path="/social" element={<Social />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </SolanaWalletProvider>
  </QueryClientProvider>
);

export default App;
