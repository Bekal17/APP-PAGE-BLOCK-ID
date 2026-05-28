import { useCrossmintAuth as useCrossmintSDKAuth } from "@crossmint/client-sdk-react-ui";

export function useCrossmintAuth() {
  const { login, logout, user } = useCrossmintSDKAuth();

  const loginWithGoogle = () => {
    localStorage.removeItem("blockid_logged_out");
    login();
  };

  const loginWithEmail = () => {
    localStorage.removeItem("blockid_logged_out");
    login();
  };

  const logoutCrossmint = async () => {
    try { 
      await logout();
    } catch {}
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
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
