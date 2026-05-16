import { usePrivy } from "@privy-io/react-auth";

export function usePrivyAuth() {
  const { login, logout, authenticated, user } = usePrivy();

  const loginWithGoogle = () => {
    localStorage.removeItem("blockid_logged_out");
    login();
  };

  const loginWithEmail = () => {
    localStorage.removeItem("blockid_logged_out");
    login();
  };

  const logoutPrivy = async () => {
    try { await logout(); } catch {}
    sessionStorage.clear();
    localStorage.clear();
    localStorage.setItem("blockid_logged_out", "true");
    window.location.replace("/login");
  };

  return {
    loginWithGoogle,
    loginWithEmail,
    logoutPrivy,
    authenticated,
    user,
  };
}
