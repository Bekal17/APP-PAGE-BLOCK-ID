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

// Follow a wallet
export async function followWallet(fromWallet: string, toWallet: string) {
  const res = await fetch(buildSocialUrl("/social/follow"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from_wallet: fromWallet,
      to_wallet: toWallet,
      signed_message: "BlockID Follow",
      signature: "devtest_signature_bypass",
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
  postType: "PUBLIC" | "FOLLOWERS_ONLY" = "PUBLIC"
) {
  const res = await fetch(buildSocialUrl("/social/post"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      content,
      post_type: postType,
      signed_message: "BlockID Post",
      signature: "devtest_signature_bypass",
    }),
  });
  if (!res.ok) throw new Error("Failed to create post");
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      post_id: postId,
      quote_content: quoteContent ?? "",
      signed_message: "BlockID Repost",
      signature: "devtest_signature_bypass",
    }),
  });
  if (!res.ok) throw new Error("Failed to repost");
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

// Get notifications for a wallet
export async function getNotifications(wallet: string) {
  const res = await fetch(
    buildSocialUrl(`/social/notifications/${encodeURIComponent(wallet)}`)
  );
  if (!res.ok) throw new Error("Failed to fetch notifications");
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
