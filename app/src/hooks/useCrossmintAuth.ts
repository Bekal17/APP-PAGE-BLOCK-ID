import { useAuth } from "@crossmint/client-sdk-react-ui";

export function useCrossmintAuth() {
  const { login, logout, user } = useAuth();

  const loginWithGoogle = () => {
    localStorage.removeItem("blockid_logged_out");
    login();
  };

  const loginWithEmail = () => {
    localStorage.removeItem("blockid_logged_out");
    login();
  };

  const logoutCrossmint = async () => {
    try { await logout(); } catch {}
    localStorage.clear();
    localStorage.setItem("blockid_logged_out", "true");
    window.location.replace("/login");
  };

  return {
    loginWithGoogle,
    loginWithEmail,
    logoutCrossmint,
    authenticated: !!user,
    user,
  };
}
