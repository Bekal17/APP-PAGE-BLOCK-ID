type UserAvatarProps = {
  avatarUrl?: string | null;
  avatarType?: "NFT" | "PHOTO" | "NONE" | string | null;
  avatarIsAnimated?: boolean;
  handle?: string | null;
  wallet?: string | null;
  size?: number; // px, default 36
};

export default function UserAvatar({
  avatarUrl,
  avatarType,
  avatarIsAnimated,
  handle,
  wallet,
  size = 36,
}: UserAvatarProps) {
  const avatarLetter = handle
    ? handle.charAt(0).toUpperCase()
    : wallet
      ? wallet.charAt(0).toUpperCase()
      : "?";
  const isNFT = avatarType === "NFT" && !!avatarUrl;
  const isPhoto = avatarType === "PHOTO" && !!avatarUrl;

  const sizeClass = `${size}px`;
  const fontSize = Math.round(size * 0.35);
  const borderWidth = size >= 60 ? "3px" : "2px";
  const outlineWidth = size >= 60 ? "3px" : "2px";

  // NFT — square with gold border (exact from Profile.tsx)
  if (isNFT) {
    const nftStyle = {
      width: sizeClass,
      height: sizeClass,
      borderRadius: "8px",
      border: `${borderWidth} solid gold`,
      boxShadow: "0 0 12px rgba(255,215,0,0.6)",
      outline: `${outlineWidth} solid hsl(var(--background))`,
      objectFit: "cover" as const,
      display: "block",
      flexShrink: 0,
    };

    return avatarIsAnimated ? (
      <video
        src={avatarUrl}
        autoPlay
        loop
        muted
        playsInline
        style={nftStyle}
      />
    ) : (
      <img
        src={avatarUrl}
        alt={handle ?? wallet ?? "avatar"}
        style={nftStyle}
      />
    );
  }

  // PHOTO — circle like X (exact from Profile.tsx)
  if (isPhoto) {
    return (
      <img
        src={avatarUrl}
        alt={handle ?? wallet ?? "avatar"}
        style={{
          width: sizeClass,
          height: sizeClass,
          borderRadius: "50%",
          objectFit: "cover",
          border: `${borderWidth} solid white`,
          outline: `${outlineWidth} solid hsl(var(--background))`,
          display: "block",
          flexShrink: 0,
        }}
      />
    );
  }

  // Default — letter in circle (exact from Profile.tsx)
  return (
    <div
      style={{
        width: sizeClass,
        height: sizeClass,
        borderRadius: "50%",
        background: "hsl(var(--muted))",
        border: `${borderWidth} solid hsl(var(--border))`,
        outline: `${outlineWidth} solid hsl(var(--background))`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${fontSize}px`,
        fontWeight: "bold",
        color: "var(--foreground, #fff)",
        flexShrink: 0,
      }}
    >
      {avatarLetter}
    </div>
  );
}
