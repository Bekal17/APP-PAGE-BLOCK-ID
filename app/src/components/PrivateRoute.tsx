import { usePhantomAuth } from "@/hooks/usePhantomAuth";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { connected } = usePhantomAuth();

  if (!connected) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
