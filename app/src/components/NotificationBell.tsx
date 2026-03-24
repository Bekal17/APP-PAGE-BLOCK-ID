import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { getNotifications } from "@/services/blockidApi";
import { createPortal } from "react-dom";

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
  const normalized = iso.replace("+00:00", "Z").replace(/\.\d+Z$/, (m) => m);
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const NotificationBell = () => {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const wallet = publicKey?.toString() ?? "";

  const fetchNotifs = async () => {
    if (!wallet) return;
    try {
      const data = await getNotifications(wallet);
      const notifs = data.notifications ?? data ?? [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    if (!wallet) return;
    fetchNotifs();
  }, [wallet]);

  useEffect(() => {
    if (!wallet) return;
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [wallet]);

  const handleOpen = () => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((prev) => !prev);
    if (!open) fetchNotifs();
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  if (!wallet) return null;

  return (
    <>
      <button
        ref={bellRef}
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: dropdownPos.top,
              right: dropdownPos.right,
              zIndex: 99999,
              width: "320px",
            }}
            className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-100">
                Notifications
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                See all
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500">
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 10).map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors cursor-pointer border-b border-zinc-800/50 last:border-0 ${
                      !notif.is_read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (notif.post_id) {
                        navigate(`/profile/${notif.from_wallet}`);
                      }
                      setOpen(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotifIcon(notif.type ?? notif.notif_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 leading-snug">
                        {notif.message ??
                          notif.content ??
                          `${notif.type} notification`}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {formatTimeAgo(notif.created_at ?? notif.timestamp)}
                      </p>
                    </div>

                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default NotificationBell;

