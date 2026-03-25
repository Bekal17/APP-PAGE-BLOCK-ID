import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOpenfort } from "@/providers/OpenfortProvider";
import { useToast } from "@/hooks/use-toast";

export default function LoginEmail() {
  const { signInWithEmail, signUpWithEmail } = useOpenfort();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to your BlockID account"
              : "Start building your on-chain identity"}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </div>

        {/* Toggle mode */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary hover:underline font-medium"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors text-center"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
