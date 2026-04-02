import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {t("settings.language")}
      </label>
      <div className="grid grid-cols-1 gap-1.5">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
              i18n.language === lang.code ||
              i18n.language?.startsWith(lang.code)
                ? "bg-primary/15 text-primary border border-primary/25"
                : "bg-zinc-800/50 text-muted-foreground hover:bg-zinc-800 hover:text-foreground border border-transparent"
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <span className="font-medium">{lang.label}</span>
            {(i18n.language === lang.code ||
              i18n.language?.startsWith(lang.code)) && (
              <span className="ml-auto text-primary text-xs">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

