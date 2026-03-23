const API_BASE =
  import.meta.env.VITE_EXPLORER_API_URL ?? "http://172.22.80.1:8001";

function buildUrl(path: string): string {
  const base = API_BASE.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function getWalletBalance(wallet: string) {
  const res = await fetch(
    buildUrl(`/wallet/${encodeURIComponent(wallet)}/balance`)
  );
  if (!res.ok) throw new Error("Failed to fetch balance");
  return res.json();
}

export async function getWalletOverview(wallet: string) {
  const res = await fetch(buildUrl(`/wallet_overview/${encodeURIComponent(wallet)}`));
  if (!res.ok) {
    const fallback = await fetch(
      buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/summary-compact`)
    );
    if (!fallback.ok) throw new Error("Failed to fetch wallet overview");
    return fallback.json();
  }
  return res.json();
}

export async function getTimeline(wallet: string) {
  const res = await fetch(
    buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/timeline`)
  );
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
}

export async function getFlowPath(wallet: string) {
  const res = await fetch(
    buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/flow-path`)
  );
  if (!res.ok) throw new Error("Failed to fetch flow path");
  return res.json();
}

const graphCache = new Map<string, unknown>();

export function getGraphCache(wallet: string): unknown {
  return graphCache.get(wallet) ?? null;
}

export function setGraphCache(wallet: string, data: unknown): void {
  graphCache.set(wallet, data);
}

export async function getGraph(wallet: string) {
  const res = await fetch(
    buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/graph`)
  );
  if (!res.ok) throw new Error("Failed to fetch graph");
  return res.json();
}

export async function getNeighbors(wallet: string) {
  const res = await fetch(
    buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/neighbors`)
  );
  if (!res.ok) throw new Error("Failed to fetch neighbors");
  return res.json();
}

export async function getCounterparties(wallet: string) {
  const res = await fetch(
    buildUrl(`/explorer/identity/${encodeURIComponent(wallet)}/counterparties`)
  );
  if (!res.ok) throw new Error("Failed to fetch counterparties");
  return res.json();
}

const SOCIAL_API_BASE =
  import.meta.env.VITE_SOCIAL_API_URL ??
  "https://blockid-backend-production.up.railway.app";

function buildSocialUrl(path: string): string {
  const base = SOCIAL_API_BASE.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

const SESSION_KEY = "blockid_session_token";

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function loginWithSignature(
  wallet: string,
  signMessage: (msg: Uint8Array) => Promise<Uint8Array>
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `BlockID Login:${wallet}:${timestamp}`;
  const msgBytes = new TextEncoder().encode(message);

  let signature: string;
  try {
    const sigBytes = await signMessage(msgBytes);
    const bs58 = await import("bs58");
    signature = bs58.default.encode(sigBytes);
  } catch {
    throw new Error("User rejected signature");
  }

  const res = await fetch(buildSocialUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      signed_message: message,
      signature,
    }),
  });

  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  setSessionToken(data.session_token);
  return data.session_token;
}

function getAuthHeaders(): Record<string, string> {
  const token = getSessionToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Fetch explore feed (public posts, trust-weighted)
export async function getSocialFeed() {
  const res = await fetch(buildSocialUrl("/social/feed/explore"));
  if (!res.ok) throw new Error("Failed to fetch social feed");
  return res.json();
}

// Fetch following feed for a wallet
export async function getFollowingFeed(wallet: string) {
  const res = await fetch(
    buildSocialUrl(`/social/feed/following/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) throw new Error("Failed to fetch following feed");
  return res.json();
}

// Fetch followers for a wallet
export async function getFollowers(wallet: string) {
  const res = await fetch(
    buildSocialUrl(`/social/followers/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) throw new Error("Failed to fetch followers");
  return res.json();
}

// Fetch following for a wallet
export async function getFollowing(wallet: string) {
  const res = await fetch(
    buildSocialUrl(`/social/following/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) throw new Error("Failed to fetch following");
  return res.json();
}

// Fetch wallet social profile
export async function getSocialProfile(wallet: string): Promise<any> {
  const res = await fetch(
    buildSocialUrl(`/social/profile/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) throw new Error("Failed to fetch social profile");
  return res.json();
}

export async function getWalletNames(wallet: string) {
  const res = await fetch(
    buildSocialUrl(`/social/profile/names/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) throw new Error("Failed to fetch names");
  return res.json();
}

export async function updateProfile(data: {
  wallet: string;
  session_token: string | null;
  display_name?: string;
  display_name_source?: string;
  bio?: string;
  website?: string;
  location?: string;
}) {
  const res = await fetch(buildSocialUrl("/social/profile/update"), {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...data,
      session_token: data.session_token ?? getSessionToken(),
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.detail ?? `HTTP ${res.status}: Failed to update profile`
    );
  }
  return res.json();
}

// Follow a wallet
export async function followWallet(fromWallet: string, toWallet: string) {
  const res = await fetch(buildSocialUrl("/social/follow"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      follower_wallet: fromWallet,
      following_wallet: toWallet,
      signed_message: "BlockID Follow",
      signature: "devtest_signature_bypass",
      session_token: getSessionToken(),
    }),
  });
  if (!res.ok) throw new Error("Failed to follow wallet");
  return res.json();
}

// Endorse a wallet
export async function endorseWallet(
  fromWallet: string,
  toWallet: string,
  message: string = ""
) {
  const res = await fetch(buildSocialUrl("/social/endorse"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from_wallet: fromWallet,
      to_wallet: toWallet,
      message,
      signature: "devtest_signature_bypass",
    }),
  });
  if (!res.ok) throw new Error("Failed to endorse wallet");
  return res.json();
}

// Create a post
export async function createPost(
  wallet: string,
  content: string,
  postType: "PUBLIC" | "FOLLOWERS_ONLY" = "PUBLIC",
  parentId?: number
) {
  const res = await fetch(buildSocialUrl("/social/post"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      wallet,
      content,
      post_type: postType,
      parent_id: parentId ?? null,
      signed_message: "BlockID Post",
      signature: "devtest_signature_bypass",
      session_token: getSessionToken(),
    }),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}

export async function getPost(postId: number) {
  const res = await fetch(buildSocialUrl(`/social/post/${postId}`));
  if (!res.ok) throw new Error("Failed to fetch post");
  return res.json();
}

// Repost a post
export async function repostPost(
  wallet: string,
  postId: number,
  quoteContent?: string
) {
  const res = await fetch(buildSocialUrl("/social/repost"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      wallet,
      post_id: postId,
      quote_content: quoteContent ?? "",
      signed_message: "BlockID Repost",
      signature: "devtest_signature_bypass",
      session_token: getSessionToken(),
    }),
  });
  if (!res.ok) throw new Error("Failed to repost");
  return res.json();
}

export async function deletePost(wallet: string, postId: number) {
  const apiBase = (import.meta.env.VITE_SOCIAL_API_URL ?? "").replace(/\/$/, "");
  const res = await fetch(
    `${apiBase}/social/post/${postId}?wallet=${encodeURIComponent(wallet)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete post");
  return res.json();
}

// Report a post
export async function reportPost(
  wallet: string,
  postId: number,
  reason: string,
  details?: string
) {
  const res = await fetch(buildSocialUrl("/social/report"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      post_id: postId,
      reason,
      details: details ?? "",
      signed_message: "BlockID Report",
      signature: "devtest_signature_bypass",
    }),
  });
  if (!res.ok) throw new Error("Failed to report");
  return res.json();
}

// Like a post
export async function likePost(wallet: string, postId: number) {
  const res = await fetch(buildSocialUrl("/social/like"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      post_id: postId,
      signed_message: "BlockID Like",
      signature: "devtest_signature_bypass",
    }),
  });
  if (!res.ok) throw new Error("Failed to like post");
  return res.json();
}

export async function unlikePost(wallet: string, postId: number) {
  const res = await fetch(buildSocialUrl("/social/like"), {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      wallet,
      post_id: postId,
      signature: "devtest_signature_bypass",
      session_token: getSessionToken(),
    }),
  });
  if (!res.ok) throw new Error("Failed to unlike post");
  return res.json();
}

// Get notifications for a wallet
export async function getNotifications(wallet: string) {
  const res = await fetch(
    buildSocialUrl(`/social/notifications/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function markNotificationRead(notifId: number, wallet: string) {
  const res = await fetch(
    buildSocialUrl(`/social/notifications/${encodeURIComponent(notifId)}/read`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet,
        signature: "devtest_signature_bypass",
      }),
    }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getDMConversations(wallet: string) {
  const res = await fetch(
    buildSocialUrl(`/social/dm/conversations/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function getDMMessages(wallet: string, otherWallet: string) {
  const res = await fetch(
    buildSocialUrl(
      `/social/dm/messages/${encodeURIComponent(wallet)}/${encodeURIComponent(
        otherWallet
      )}`
    )
  );
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function sendDM(
  wallet: string,
  toWallet: string,
  content: string
) {
  const res = await fetch(buildSocialUrl("/social/dm/send"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      to_wallet: toWallet,
      content,
      signature: "devtest_signature_bypass",
    }),
  });
  if (!res.ok) throw new Error("Failed to send DM");
  return res.json();
}

export async function getDMUnreadCount(wallet: string) {
  const res = await fetch(
    buildSocialUrl(`/social/dm/unread-count/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) return { unread_count: 0 };
  return res.json();
}

export async function bookmarkPost(wallet: string, postId: number) {
  const res = await fetch(buildSocialUrl("/social/bookmark"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      wallet,
      post_id: postId,
      signature: "devtest_signature_bypass",
      session_token: getSessionToken(),
    }),
  });
  if (!res.ok) throw new Error("Failed to bookmark");
  return res.json();
}

export async function getBookmarks(wallet: string) {
  const res = await fetch(
    buildSocialUrl(`/social/bookmarks/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) throw new Error("Failed to fetch bookmarks");
  return res.json();
}

export async function getBookmarkIds(wallet: string) {
  const res = await fetch(
    buildSocialUrl(
      `/social/bookmarks/${encodeURIComponent(wallet)}/ids`
    )
  );
  if (!res.ok) return { post_ids: [] };
  return res.json();
}

export async function getWalletPosts(wallet: string) {
  const res = await fetch(
    buildSocialUrl(`/social/posts/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) throw new Error("Failed to fetch wallet posts");
  return res.json();
}

// Avatar & Banner
export async function uploadAvatarPhoto(
  wallet: string,
  file: File
): Promise<any> {
  const formData = new FormData();
  formData.append("wallet", wallet);
  formData.append("signature", "devtest_signature_bypass");
  formData.append("file", file);
  const res = await fetch(buildSocialUrl("/social/avatar/photo"), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload avatar");
  return res.json();
}

export async function uploadBannerPhoto(
  wallet: string,
  file: File
): Promise<any> {
  const formData = new FormData();
  formData.append("wallet", wallet);
  formData.append("signature", "devtest_signature_bypass");
  formData.append("file", file);
  const res = await fetch(buildSocialUrl("/social/banner/photo"), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload banner");
  return res.json();
}

export async function getWalletNFTs(wallet: string): Promise<any> {
  const res = await fetch(
    buildSocialUrl(`/social/nfts/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) throw new Error("Failed to fetch NFTs");
  return res.json();
}

export async function setNFTAvatar(
  wallet: string,
  nftMint: string
): Promise<any> {
  const res = await fetch(buildSocialUrl("/social/avatar"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      nft_mint: nftMint,
      signed_message: "BlockID Avatar",
      signature: "devtest_signature_bypass",
    }),
  });
  if (!res.ok) throw new Error("Failed to set NFT avatar");
  return res.json();
}

export async function setNFTBanner(
  wallet: string,
  nftMint: string
): Promise<any> {
  const res = await fetch(buildSocialUrl("/social/banner"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      nft_mint: nftMint,
      signed_message: "BlockID Banner",
      signature: "devtest_signature_bypass",
    }),
  });
  if (!res.ok) throw new Error("Failed to set NFT banner");
  return res.json();
}

export async function removeAvatar(wallet: string): Promise<any> {
  const res = await fetch(buildSocialUrl("/social/avatar"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      signature: "devtest_signature_bypass",
    }),
  });
  if (!res.ok) throw new Error("Failed to remove avatar");
  return res.json();
}

export async function removeBanner(wallet: string): Promise<any> {
  const res = await fetch(buildSocialUrl("/social/banner"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      signature: "devtest_signature_bypass",
    }),
  });
  if (!res.ok) throw new Error("Failed to remove banner");
  return res.json();
}

export async function getPrivacySettings(wallet: string) {
  const res = await fetch(
    buildSocialUrl(
      `/social/settings/${encodeURIComponent(wallet)}`
    )
  );
  if (!res.ok) throw new Error("Failed to fetch privacy settings");
  return res.json();
}

export async function updatePrivacySettings(
  wallet: string,
  settings: Record<string, any>
) {
  const res = await fetch(
    buildSocialUrl(
      `/social/settings/${encodeURIComponent(wallet)}`
    ),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        signature: "devtest_signature_bypass",
      }),
    }
  );
  if (!res.ok) throw new Error("Failed to update privacy settings");
  return res.json();
}

export async function incrementScan(wallet: string): Promise<void> {
  const apiBase = (import.meta.env.VITE_EXPLORER_API_URL ?? "").replace(/\/$/, "");
  try {
    await fetch(
      `${apiBase}/subscription/scan/increment/${encodeURIComponent(wallet)}`,
      { method: "POST" }
    );
  } catch {
    // silent fail — don't block UX
  }
}
