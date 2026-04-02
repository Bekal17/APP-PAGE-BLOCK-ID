import { useState, useEffect, type ChangeEvent } from "react";
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

// Store pending language so parent Save Changes can apply it
let pendingLanguage: string | null = null;

export function getPendingLanguage() {
  return pendingLanguage;
}

export function applyPendingLanguage(i18n: {
  changeLanguage: (lng: string) => void;
}) {
  if (pendingLanguage) {
    i18n.changeLanguage(pendingLanguage);
    pendingLanguage = null;
  }
}

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language?.slice(0, 2) || "en";
  const [selectedLang, setSelectedLang] = useState(currentLang);

  useEffect(() => {
    setSelectedLang(i18n.language?.slice(0, 2) || "en");
  }, [i18n.language]);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLang(e.target.value);
    pendingLanguage = e.target.value;
  };

  const currentFlag =
    languages.find((l) => l.code === selectedLang)?.flag || "🇬🇧";

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {t("settings.language")}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">
          {currentFlag}
        </span>
        <select
          value={selectedLang}
          onChange={handleChange}
          className="w-full appearance-none bg-zinc-800/60 border border-zinc-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
