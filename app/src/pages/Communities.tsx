import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Lock, Pin, PinOff, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getCommunities,
  getSessionToken,
  pinCommunity,
  syncCommunities,
  type CommunityItem,
  unpinCommunity,
} from "@/services/blockidApi";
import { useToast } from "@/hooks/use-toast";

const Communities = () => {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toString() ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [pinLoading, setPinLoading] = useState<Record<string, boolean>>({});

  const memberCommunities = useMemo(
    () => communities.filter((c) => c.is_member),
    [communities]
  );
  const exploreCommunities = useMemo(
    () => communities.filter((c) => !c.is_member),
    [communities]
  );

  useEffect(() => {
    if (!wallet) {
      setCommunities([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        await syncCommunities(wallet, getSessionToken());
      } catch {
        // Keep UX resilient even if sync fails.
      }
      try {
        const data = await getCommunities(wallet);
        if (!cancelled) setCommunities(data.communities ?? []);
      } catch {
        if (!cancelled) setCommunities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  const togglePin = async (community: CommunityItem) => {
    if (!wallet) return;
    const key = community.collection_address;
    setPinLoading((prev) => ({ ...prev, [key]: true }));
    try {
      if (community.is_pinned) {
        await unpinCommunity(wallet, key, getSessionToken());
      } else {
        await pinCommunity(wallet, key, getSessionToken());
      }
      setCommunities((prev) =>
        prev.map((item) =>
          item.collection_address === key
            ? { ...item, is_pinned: !item.is_pinned }
            : item
        )
      );
    } catch {
      toast({
        title: "Failed to update pin",
        variant: "destructive",
      });
    } finally {
      setPinLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const imageFallback = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Communities</h1>
          <p className="text-sm text-zinc-400 mt-1">
            NFT-gated feeds powered by collections in your wallet.
          </p>
        </div>

        {!wallet ? (
          <div className="glass-card p-6 text-center text-sm text-zinc-400">
            Connect your wallet to view communities.
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-sm uppercase tracking-wide text-zinc-400">
                My Communities
              </h2>
              {memberCommunities.length === 0 ? (
                <div className="glass-card p-4 text-sm text-zinc-400">
                  No member communities detected yet.
                </div>
              ) : (
                <div className="grid gap-3">
                  {memberCommunities.map((community) => (
                    <div
                      key={community.collection_address}
                      onClick={() =>
                        navigate(`/communities/${community.collection_address}`)
                      }
                      className="glass-card p-4 border border-zinc-800 hover:border-zinc-700 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {community.collection_image ? (
                            <img
                              src={community.collection_image}
                              alt={community.collection_name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center">
                              {imageFallback(community.collection_name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-100 truncate">
                              {community.collection_name}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {(community.member_count ?? 0).toLocaleString()} members ·{" "}
                              {(community.post_count ?? 0).toLocaleString()} posts
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void togglePin(community);
                          }}
                          disabled={pinLoading[community.collection_address]}
                          className="px-2.5 py-1.5 text-xs rounded-full border border-zinc-700 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {community.is_pinned ? (
                            <span className="inline-flex items-center gap-1">
                              <PinOff className="w-3.5 h-3.5" />
                              Unpin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Pin className="w-3.5 h-3.5" />
                              Pin
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-sm uppercase tracking-wide text-zinc-400">
                Explore Communities
              </h2>
              {exploreCommunities.length === 0 ? (
                <div className="glass-card p-4 text-sm text-zinc-400">
                  No additional communities available right now.
                </div>
              ) : (
                <div className="grid gap-3">
                  {exploreCommunities.map((community) => (
                    <div
                      key={community.collection_address}
                      className="glass-card p-4 border border-zinc-800 opacity-90"
                    >
                      <div className="flex items-center gap-3">
                        {community.collection_image ? (
                          <img
                            src={community.collection_image}
                            alt={community.collection_name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center">
                            {imageFallback(community.collection_name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-100 truncate">
                            {community.collection_name}
                          </p>
                          <p className="text-xs text-zinc-400 inline-flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {(community.member_count ?? 0).toLocaleString()} members
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-amber-300 mt-3 inline-flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Requires {community.collection_name} NFT to join
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Communities;
