import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Shield, Users } from "lucide-react";
import { getSocialProfile, followWallet } from "@/services/blockidApi";
import SubscriptionBadge from "@/components/blockid/SubscriptionBadge";

interface WalletHoverCardProps {
  wallet: string;
  handle?: string;
  children: React.ReactNode;
  isFollowing?: boolean;
}

const WalletHoverCard = ({
  wallet,
  handle,
  children,
  isFollowing: initialFollowing = false,
}: WalletHoverCardProps) => {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(initialFollowing);
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOwnWallet = publicKey?.toString() === wallet;

  const fetchProfile = async () => {
    if (profile || loading) return;
    setLoading(true);
    try {
      const data = await getSocialProfile(wallet);
      setProfile(data);
    } catch {
      setProfile(null);
    }
    setLoading(false);
  };

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const cardWidth = 280;
        let left = rect.left;
        if (left + cardWidth > window.innerWidth) {
          left = window.innerWidth - cardWidth - 16;
        }
        setCardPos({
          top: rect.bottom + 8,
          left,
        });
      }
      console.log("Hover card showing", { wallet, cardPos });
      setShow(true);
      fetchProfile();
    }, 400);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShow(false);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  useEffect(() => {
    if (!show) return;

    const handleScroll = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const cardWidth = 280;
        let left = rect.left;
        if (left + cardWidth > window.innerWidth) {
          left = window.innerWidth - cardWidth - 16;
        }
        // hide card if trigger scrolled out of viewport
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setShow(false);
          return;
        }
        setCardPos({
          top: rect.bottom + 8,
          left,
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [show]);

  const score = profile?.trust_score ?? 0;
  const scoreColor = score >= 70
    ? "bg-green-500/20 text-green-400"
    : score >= 40
    ? "bg-orange-500/20 text-orange-400"
    : "bg-red-500/20 text-red-400";

  const displayName = profile?.handle
    ? `@${profile.handle}`
    : handle
    ? `@${handle}`
    : `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  const avatarInitial = (
    profile?.handle ?? handle ?? wallet ?? "?"
  )[0].toUpperCase();

  return (
    <>
      {/* Trigger */}
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/profile/${wallet}`);
        }}
        className="cursor-pointer hover:underline hover:text-primary transition-colors"
      >
        {children}
      </span>

      {/* Hover Card — fixed position via portal */}
      {show &&
        createPortal(
          <div
            onMouseEnter={() => {
              if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            }}
            onMouseLeave={() => {
              hideTimeoutRef.current = setTimeout(() => {
                setShow(false);
              }, 300);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: cardPos.top,
              left: cardPos.left,
              zIndex: 99999,
              width: "280px",
              pointerEvents: "auto",
            }}
            className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4"
          >
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-700" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-zinc-700 rounded w-24" />
                    <div className="h-3 bg-zinc-700 rounded w-32" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-12 h-12 object-cover"
                        style={{
                          borderRadius: profile?.avatar_type === "NFT" ? "8px" : "50%",
                          border: profile?.avatar_type === "NFT"
                            ? "2px solid gold"
                            : "2px solid #52525b",
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center text-lg font-bold text-zinc-100">
                        {avatarInitial}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-zinc-100 flex items-center gap-1">
                        {displayName}
                        <SubscriptionBadge plan={profile?.plan ?? "free"} size="sm" />
                      </p>
                      <p className="text-xs text-zinc-400 font-mono">
                        {wallet.slice(0, 6)}...{wallet.slice(-4)}
                      </p>
                    </div>
                  </div>
                  {!isOwnWallet && publicKey && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!publicKey) return;
                        try {
                          await followWallet(publicKey.toString(), wallet);
                          setFollowing(true);
                        } catch {}
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        following
                          ? "bg-zinc-700 text-muted-foreground"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {following ? "Following" : "Follow"}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${scoreColor}`}>
                    <Shield className="w-3 h-3" />
                    {Math.round(score)}
                  </span>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {profile?.follower_count ?? 0} followers
                  </span>
                <span className="text-xs text-zinc-400">
                    {profile?.following_count ?? 0} following
                  </span>
                </div>

                {profile?.badges && (() => {
                  try {
                    const list = typeof profile.badges === "string"
                      ? JSON.parse(profile.badges)
                      : profile.badges;
                    return Array.isArray(list) && list.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {list.slice(0, 3).map((badge: string) => (
                          <span key={badge} className="px-1.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : null;
                  } catch {
                    return null;
                  }
                })()}

                <button
                  onClick={() => navigate(`/profile/${wallet}`)}
                  className="w-full text-xs text-center text-zinc-400 hover:text-zinc-100 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors border border-zinc-800 hover:border-zinc-600"
                >
                  View Full Profile →
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
};

export default WalletHoverCard;

