import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Bell,
  UserPlus,
  Heart,
  MessageSquare,
  Award,
  Repeat2,
  Shield,
  ArrowLeft,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { getNotifications } from "@/services/blockidApi";

const getNotifIcon = (type: string) => {
  switch (type) {
    case "FOLLOW":
      return <UserPlus className="w-4 h-4 text-blue-400" />;
    case "LIKE":
      return <Heart className="w-4 h-4 text-red-400" />;
    case "REPLY":
      return <MessageSquare className="w-4 h-4 text-green-400" />;
    case "ENDORSE":
      return <Award className="w-4 h-4 text-yellow-400" />;
    case "REPOST":
      return <Repeat2 className="w-4 h-4 text-purple-400" />;
    default:
      return <Shield className="w-4 h-4 text-primary" />;
  }
};

const formatTimeAgo = (iso?: string) => {
  if (!iso) return "";
  // Handle both "Z" and "+00:00" timezone formats
  const normalized = iso.replace("+00:00", "Z").replace(/\.\d+Z$/, (m) => m);
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const Notifications = () => {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const wallet = publicKey?.toString() ?? "";

  const getNotifLabel = (type: string) => {
    switch (type) {
      case "FOLLOW":
        return t("notifications.wallet_followed");
      case "LIKE":
        return t("notifications.liked_your_post");
      case "REPLY":
        return t("notifications.replied_to_post");
      case "ENDORSE":
        return t("notifications.endorsed_you");
      case "REPOST":
        return t("notifications.type_repost");
      case "MENTION":
        return t("notifications.mentioned_you");
      default:
        return t("notifications.default_type");
    }
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!wallet) {
      setLoading(false);
      return;
    }
    const fetch = async () => {
      try {
        const data = await getNotifications(wallet);
        setNotifications(data.notifications ?? data ?? []);
      } catch {
        setNotifications([]);
      }
      setLoading(false);
    };
    fetch();

    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [wallet]);

  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!wallet) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center text-muted-foreground">
          <Bell className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">{t("common.connect_wallet")}</p>
          <p className="text-sm mt-1">{t("notifications.connect_subtitle")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 py-4 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {t("notifications.title")}
            </h1>
          </div>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/15 text-primary">
              {t("notifications.badge_new", { count: unreadCount })}
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 border-b border-border pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              filter === "all"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("notifications.all")}
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              filter === "unread"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("notifications.unread")}
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="glass-card p-4 flex gap-3 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-muted/50 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/50 rounded w-3/4" />
                  <div className="h-3 bg-muted/40 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              {filter === "unread"
                ? t("notifications.empty_unread")
                : t("notifications.empty")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif: any) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.from_wallet) {
                    navigate(`/profile/${notif.from_wallet}`);
                  }
                }}
                className={`glass-card p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/10 transition-colors ${
                  !notif.is_read ? "border-l-2 border-primary" : ""
                }`}
              >
                {/* Type icon */}
                <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                  {getNotifIcon(notif.type ?? notif.notif_type ?? "")}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {getNotifLabel(notif.type ?? notif.notif_type ?? "")}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatTimeAgo(
                        notif.created_at ?? notif.timestamp
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">
                    {notif.message ??
                      notif.content ??
                      t("notifications.fallback_new")}
                  </p>
                  {notif.from_wallet && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {notif.from_wallet.slice(0, 6)}...
                      {notif.from_wallet.slice(-4)}
                    </p>
                  )}
                </div>

                {/* Unread indicator */}
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;

