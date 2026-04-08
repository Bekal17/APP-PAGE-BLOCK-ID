import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useWallet } from "@solana/wallet-adapter-react";
import { Shield } from "lucide-react";
import SettingsLayout from "@/components/SettingsLayout";
import LanguageSwitcher, {
  applyPendingLanguage,
} from "@/components/LanguageSwitcher";
import {
  getPrivacySettings,
  updatePrivacySettings,
} from "@/services/blockidApi";

type WalletDisplay = "TRUNCATED" | "HIDDEN";

const PrivacySettings = () => {
  const { t, i18n } = useTranslation();
  const { publicKey } = useWallet();
  const wallet = publicKey?.toString() ?? "";
  const [settings, setSettings] = useState<any>({
    wallet_display: "TRUNCATED" as WalletDisplay,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!wallet) { setLoading(false); return; }
    getPrivacySettings(wallet)
      .then((privacy) =>
        setSettings({
          ...privacy,
          wallet_display: privacy?.wallet_display ?? "TRUNCATED",
        })
      )
      .catch(() =>
        setSettings({
          wallet_display: "TRUNCATED" as WalletDisplay,
        })
      )
      .finally(() => setLoading(false));
  }, [wallet]);

  const handleSave = async () => {
    if (!wallet || !settings) return;
    applyPendingLanguage(i18n);
    setSaving(true);
    try {
      await updatePrivacySettings(wallet, {
        posts_visibility: settings.posts_visibility,
        wallet_display: settings.wallet_display,
        balance_visibility: settings.balance_visibility,
        score_visibility: settings.score_visibility,
        profile_discoverable: settings.profile_discoverable,
        show_activity_feed: settings.show_activity_feed,
        allow_mentions: settings.allow_mentions,
        allow_follows: settings.allow_follows,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (!wallet) {
    return (
      <SettingsLayout
        title={t("settings.privacy_safety")}
        description={t("settings.privacy_desc_short")}
      >
        <LanguageSwitcher />
        <div className="flex flex-col items-center
          justify-center py-12 text-muted-foreground">
          <Shield className="w-12 h-12 mb-4 opacity-30" />
          <p>{t("settings.connect_wallet_manage")}</p>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title={t("settings.privacy_safety")}
      description={t("settings.privacy_desc")}
    >
      <LanguageSwitcher />
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex justify-between
              items-center py-4 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="h-4 bg-zinc-700 rounded w-32" />
                <div className="h-3 bg-zinc-700 rounded w-48" />
              </div>
              <div className="h-8 bg-zinc-700 rounded w-28" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-0">

          <p className="text-sm font-bold text-foreground/70 uppercase tracking-widest pt-6 pb-2 border-t border-border/30 mt-4">
            {t("settings.content")}
          </p>

          <div className="flex items-center justify-between
            py-4 border-b border-zinc-800/50">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("settings.post_visibility")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.post_visibility_desc")}
              </p>
            </div>
            <select
              value={settings?.posts_visibility ?? "PUBLIC"}
              onChange={(e) => setSettings((s: any) => ({
                ...s, posts_visibility: e.target.value
              }))}
              className="bg-zinc-800 border border-zinc-700
                rounded-lg px-3 py-1.5 text-sm text-foreground
                focus:outline-none focus:ring-2
                focus:ring-primary/50"
            >
              <option value="PUBLIC">{t("settings.everyone")}</option>
              <option value="FOLLOWERS_ONLY">{t("settings.followers_only")}</option>
              <option value="PRIVATE">{t("settings.only_me")}</option>
            </select>
          </div>

          {/* Wallet Address */}
          <div className="flex items-center justify-between py-4 border-b border-border/50">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("settings.wallet_address")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.wallet_address_desc")}
              </p>
            </div>
            <select
              value={settings.wallet_display}
              onChange={(e) =>
                setSettings((prev: any) => ({
                  ...prev,
                  wallet_display: e.target.value as WalletDisplay,
                }))
              }
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              <option value="TRUNCATED">{t("settings.visible_truncated")}</option>
              <option value="HIDDEN">{t("settings.hidden_from_public")}</option>
            </select>
          </div>

          <div className="flex items-center justify-between
            py-4 border-b border-zinc-800/50">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("settings.activity_feed")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.activity_feed_desc")}
              </p>
            </div>
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setSettings((s: any) => ({
                  ...s, show_activity_feed: !s?.show_activity_feed
                }))}
                className={`relative inline-flex w-11 h-6 
                  rounded-full transition-colors shrink-0 ${
                  settings?.show_activity_feed
                    ? "bg-primary" : "bg-zinc-600"
                }`}
              >
                <span className={`absolute top-[2px] w-5 h-5
                  rounded-full bg-white shadow transition-transform ${
                  settings?.show_activity_feed
                    ? "translate-x-[22px]" : "translate-x-[2px]"
                }`} />
              </button>
            </div>
          </div>

          <p className="text-sm font-bold text-foreground/70 uppercase tracking-widest pt-6 pb-2 border-t border-border/30 mt-4">
            {t("settings.discoverability")}
          </p>

          <div className="flex items-center justify-between
            py-4 border-b border-zinc-800/50">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("settings.profile_discoverable")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.profile_discoverable_desc")}
              </p>
            </div>
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setSettings((s: any) => ({
                  ...s,
                  profile_discoverable: !s?.profile_discoverable
                }))}
                className={`relative inline-flex w-11 h-6 
                  rounded-full transition-colors shrink-0 ${
                  settings?.profile_discoverable
                    ? "bg-primary" : "bg-zinc-600"
                }`}
              >
                <span className={`absolute top-[2px] w-5 h-5
                  rounded-full bg-white shadow transition-transform ${
                  settings?.profile_discoverable
                    ? "translate-x-[22px]" : "translate-x-[2px]"
                }`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between
            py-4 border-b border-zinc-800/50">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("settings.allow_follows")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.allow_follows_desc")}
              </p>
            </div>
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setSettings((s: any) => ({
                  ...s,
                  allow_follows:
                    s?.allow_follows === "ALL" ? "NONE" : "ALL"
                }))}
                className={`relative inline-flex w-11 h-6 
                  rounded-full transition-colors shrink-0 ${
                  settings?.allow_follows === "ALL"
                    ? "bg-primary" : "bg-zinc-600"
                }`}
              >
                <span className={`absolute top-[2px] w-5 h-5
                  rounded-full bg-white shadow transition-transform ${
                  settings?.allow_follows === "ALL"
                    ? "translate-x-[22px]" : "translate-x-[2px]"
                }`} />
              </button>
            </div>
          </div>

          <p className="text-sm font-bold text-foreground/70 uppercase tracking-widest pt-6 pb-2 border-t border-border/30 mt-4">
            {t("settings.financial_privacy")}
          </p>

          <div className="flex items-center justify-between
            py-4 border-b border-zinc-800/50">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("settings.portfolio_balance")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.portfolio_balance_desc")}
              </p>
            </div>
            <select
              value={settings?.balance_visibility ?? "HIDDEN"}
              onChange={(e) => setSettings((s: any) => ({
                ...s, balance_visibility: e.target.value
              }))}
              className="bg-zinc-800 border border-zinc-700
                rounded-lg px-3 py-1.5 text-sm text-foreground
                focus:outline-none focus:ring-2
                focus:ring-primary/50"
            >
              <option value="PUBLIC">{t("settings.everyone")}</option>
              <option value="FOLLOWERS">{t("settings.followers_only")}</option>
              <option value="HIDDEN">{t("settings.hidden")}</option>
            </select>
          </div>

          <div className="flex items-center justify-between
            py-4 border-b border-zinc-800/50">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("settings.trust_score_visibility")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.trust_score_visibility_desc")}
              </p>
            </div>
            <select
              value={settings?.score_visibility ?? "PUBLIC"}
              onChange={(e) => setSettings((s: any) => ({
                ...s, score_visibility: e.target.value
              }))}
              className="bg-zinc-800 border border-zinc-700
                rounded-lg px-3 py-1.5 text-sm text-foreground
                focus:outline-none focus:ring-2
                focus:ring-primary/50"
            >
              <option value="PUBLIC">{t("settings.everyone")}</option>
              <option value="FOLLOWERS">{t("settings.followers_only")}</option>
              <option value="HIDDEN">{t("settings.hidden")}</option>
            </select>
          </div>

          <p className="text-sm font-bold text-foreground/70 uppercase tracking-widest pt-6 pb-2 border-t border-border/30 mt-4">
            {t("settings.interactions")}
          </p>

          <div className="flex items-center justify-between
            py-4 border-b border-zinc-800/50">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("settings.mentions")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.mentions_desc")}
              </p>
            </div>
            <select
              value={settings?.allow_mentions ?? "ALL"}
              onChange={(e) => setSettings((s: any) => ({
                ...s, allow_mentions: e.target.value
              }))}
              className="bg-zinc-800 border border-zinc-700
                rounded-lg px-3 py-1.5 text-sm text-foreground
                focus:outline-none focus:ring-2
                focus:ring-primary/50"
            >
              <option value="ALL">{t("settings.everyone")}</option>
              <option value="FOLLOWERS">{t("settings.followers_only")}</option>
              <option value="NONE">{t("settings.no_one")}</option>
            </select>
          </div>

          <div className="pt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg
                bg-primary text-primary-foreground
                font-medium hover:bg-primary/90
                disabled:opacity-50 transition-colors"
            >
              {saving ? t("settings.saving") : t("settings.save_changes")}
            </button>
            {saved && (
              <span className="text-sm text-green-400">
                ✓ {t("settings.saved_success")}
              </span>
            )}
          </div>

        </div>
      )}
    </SettingsLayout>
  );
};

export default PrivacySettings;
