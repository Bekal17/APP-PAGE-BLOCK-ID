import { useCrossmintAuth as useAuth } from "@crossmint/client-sdk-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const { connected } = useWallet();

  if (status === "loading") {
    return null;
  }

  if (!connected && !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
