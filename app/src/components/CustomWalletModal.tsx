import { useTranslation } from "react-i18next";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { usePhantom } from "@phantom/react-sdk";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export default function CustomWalletModal() {
  const { t } = useTranslation();
  const { wallets, select } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const { connect } = usePhantom();
  const [show, setShow] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // When wallet adapter sets visible=true, intercept it
  // Show our modal instead and immediately reset visible
  useEffect(() => {
    if (visible) {
      setVisible(false); // prevent default modal
      setShow(true); // show our custom modal
    }
  }, [visible, setVisible]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShow(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  if (!show) return null;

  const handleWalletSelect = (walletName: string) => {
    select(walletName as any);
    setShow(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShow(false);
      }}
    >
      <div
        ref={modalRef}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Connect to BlockID
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose how you want to connect
            </p>
          </div>
          <button
            onClick={() => setShow(false)}
            className="p-1.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {/* Wallet options */}
          {wallets.map((wallet) => (
            <button
              key={wallet.adapter.name}
              onClick={() => handleWalletSelect(wallet.adapter.name)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left"
            >
              <img
                src={wallet.adapter.icon}
                alt={wallet.adapter.name}
                className="w-8 h-8 rounded-lg"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {wallet.adapter.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {wallet.readyState === "Installed"
                    ? t("wallet_modal.detected")
                    : t("wallet_modal.not_installed")}
                </p>
              </div>
              {wallet.readyState === "Installed" && (
                <div className="w-2 h-2 rounded-full bg-green-400" />
              )}
            </button>
          ))}

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center px-4">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-zinc-900 px-3 text-xs text-zinc-500">
                or continue with
              </span>
            </div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() => void connect({ provider: "google" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all text-sm font-medium text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t("onboarding.continue_google")}
          </button>

          {/* Email */}
          <button
            type="button"
            onClick={() => void connect({ provider: "email" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all text-sm font-medium text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            {t("auth.continue_with_email")}
          </button>

          <p className="text-center text-xs text-zinc-600 pt-1">
            {t(
              "auth.new_to_crypto_hint",
              "New to crypto? Sign in with Google — no wallet needed.",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
