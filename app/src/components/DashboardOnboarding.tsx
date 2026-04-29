import { useTranslation } from "react-i18next";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useModal } from "@phantom/react-sdk";

const FEATURE_KEYS = [
  { icon: "🕸", titleKey: "onboarding.feat_scam_title", descKey: "onboarding.feat_scam_desc" },
  { icon: "🔗", titleKey: "onboarding.feat_network_title", descKey: "onboarding.feat_network_desc" },
  { icon: "🪙", titleKey: "onboarding.feat_token_title", descKey: "onboarding.feat_token_desc" },
  { icon: "🤖", titleKey: "onboarding.feat_ai_title", descKey: "onboarding.feat_ai_desc" },
] as const;

export default function DashboardOnboarding() {
  const { t } = useTranslation();
  const { setVisible } = useWalletModal();
  const { open } = useModal();

  return (
    <div className="w-full max-w-screen-2xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("onboarding.wallet_safety_title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("onboarding.wallet_safety_subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/60 backdrop-blur p-10 text-center shadow-[0_0_40px_rgba(34,211,238,0.15)]">
        <div className="text-4xl mb-4">🛡</div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">{t("onboarding.hero_title")}</h1>
        <p className="text-slate-400 mb-6 max-w-xl mx-auto">{t("onboarding.hero_subtitle")}</p>
        <button
          onClick={() => setVisible(true)}
          className="px-6 py-3 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          {t("onboarding.connect_wallet")}
        </button>
        <div className="mt-4 text-sm text-slate-500">{t("onboarding.supports_wallets")}</div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900/60 px-2 text-zinc-500">{t("onboarding.or_continue_with")}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void open()}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
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
        <button
          type="button"
          onClick={() => void open()}
          className="w-full mt-2 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-200"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M12 2c-3 2-4 4.5-4 7.2 0 2.1 1.3 4.1 3.3 5.2-.2-2.6.7-4.8 2.7-6.7-2.1.6-3.7 2.2-4.2 4.1-.2-.8-.3-1.6-.3-2.4 0-2.4 1.4-4.6 3.8-6.4 2.4 1.8 3.8 4 3.8 6.4 0 3.4-2.7 6.4-6.3 6.4-3.8 0-6.8-3.2-6.8-7.3 0-2.6 1.3-5 3.4-6.5" />
          </svg>
          {t("onboarding.continue_apple", "Continue with Apple")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
        {FEATURE_KEYS.map((f) => (
          <div
            key={f.titleKey}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 hover:border-cyan-500/40 transition-colors"
          >
            <div className="text-xl mb-2">{f.icon}</div>
            <h3 className="font-semibold text-foreground mb-1">{t(f.titleKey)}</h3>
            <p className="text-sm text-slate-400">{t(f.descKey)}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
        <h2 className="text-lg font-semibold text-foreground mb-6">{t("onboarding.example_section_title")}</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center h-40 w-40 rounded-full border-4 border-cyan-500 text-3xl font-bold text-foreground shadow-[0_0_30px_rgba(34,211,238,0.4)]">
              78
            </div>
            <span className="text-sm text-slate-400">{t("trust_score.score")}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-40 w-40 rounded-xl border border-slate-700 bg-slate-800/50 flex items-center justify-center">
              <span className="text-slate-400 text-sm">{t("onboarding.risk_exposure_radar")}</span>
            </div>
            <span className="text-sm text-slate-400">{t("onboarding.vectors_count")}</span>
          </div>
        </div>
        <p className="text-center text-slate-500 text-sm mt-6">{t("onboarding.example_preview_note")}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 mt-10 text-slate-400 text-sm">
        <span>{t("onboarding.wallet_phantom")}</span>
        <span>{t("onboarding.wallet_backpack")}</span>
        <span>{t("onboarding.wallet_solflare")}</span>
      </div>

      <p className="text-center text-xs text-slate-500 mt-6">{t("onboarding.security_note")}</p>
    </div>
  );
}
