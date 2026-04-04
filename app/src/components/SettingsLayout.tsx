import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ChevronLeft,
  Shield,
  User,
  Bell,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

interface SettingsLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

type SettingsNavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  danger?: boolean;
};

type SettingsNavGroup = {
  groupKey: string;
  items: SettingsNavItem[];
};

const settingsNav: SettingsNavGroup[] = [
  {
    groupKey: "settings.your_account",
    items: [
      {
        labelKey: "settings.privacy_safety",
        href: "/settings/privacy",
        icon: Shield,
        comingSoon: false,
      },
      {
        labelKey: "settings.edit_profile",
        href: "/settings/profile",
        icon: User,
        comingSoon: true,
      },
      {
        labelKey: "settings.notifications_label",
        href: "/settings/notifications",
        icon: Bell,
        comingSoon: true,
      },
    ],
  },
  {
    groupKey: "settings.danger_zone",
    items: [
      {
        labelKey: "settings.delete_account",
        href: "/settings/delete",
        icon: AlertTriangle,
        danger: true,
        comingSoon: true,
      },
    ],
  },
];

const SettingsLayout = ({
  children,
  title,
  description,
}: SettingsLayoutProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted/30
              text-muted-foreground hover:text-foreground
              transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">
            {t("nav.settings")}
          </h1>
        </div>

        <div className="flex gap-6">
          {/* Left sidebar */}
          <div className="w-60 shrink-0 space-y-6">
            {settingsNav.map((group) => (
              <div key={group.groupKey}>
                <p className="text-xs font-semibold
                  text-muted-foreground uppercase
                  tracking-wider mb-2 px-3">
                  {t(group.groupKey)}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location.pathname === item.href;
                    return (
                      <button
                        key={item.href}
                        onClick={() => {
                          if (!item.comingSoon) {
                            navigate(item.href);
                          }
                        }}
                        className={`w-full flex items-center
                          gap-3 px-3 py-2.5 rounded-lg
                          text-left transition-colors
                          ${isActive
                            ? "bg-primary/15 text-primary"
                            : item.danger
                            ? "text-red-400 hover:bg-red-500/10"
                            : "text-foreground hover:bg-muted/30"
                          }
                          ${item.comingSoon
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                          }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {t(item.labelKey)}
                          </p>
                          {item.comingSoon && (
                            <p className="text-xs text-muted-foreground">
                              {t("settings.coming_soon")}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            <div className="glass-card p-6">
              <div className="mb-6 border-b border-zinc-800 pb-4">
                <h2 className="text-lg font-bold text-foreground">
                  {title}
                </h2>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsLayout;
