import { usePhantomAuth } from "@/hooks/usePhantomAuth";
import { usePrivy } from "@privy-io/react-auth";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { connected } = usePhantomAuth();
  const { authenticated, ready } = usePrivy();

  // Wait for Privy to finish loading before deciding
  if (!ready) {
    return null;
  }

  if (!connected && !authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
