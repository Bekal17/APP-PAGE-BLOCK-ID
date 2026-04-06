import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";

const APP_BASE_URL = "https://app.blockidscore.fun";

interface ShareInvestigationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  shortAddress: string;
  trustScore: number;
  riskTier: string;
  walletAge: string;
  totalTx: number;
  uniqueCounterparties: number;
  volume30d: string;
  behaviorPatterns: string[];
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  handle?: string | null;
  badges?: string[];
  plan?: string;
  avatarType?: string | null;
  onCopyReport: () => void;
  onShareTwitter: () => void;
  onShareTelegram: () => void;
}

type ReportBuildProps = Omit<
  ShareInvestigationModalProps,
  | "open"
  | "onOpenChange"
  | "onCopyReport"
  | "onShareTwitter"
  | "onShareTelegram"
>;

const buildFullReport = (props: ReportBuildProps) => {
  const tier = props.riskTier
    ? `${props.riskTier.charAt(0).toUpperCase()}${props.riskTier.slice(1).toLowerCase()} Risk`
    : "Unknown Risk";
  const url = `${APP_BASE_URL}/wallet/${props.walletAddress}`;
  const patterns = props.behaviorPatterns.map((p) => `• ${p}`).join("\n");
  const handleLine =
    props.handle != null && props.handle !== ""
      ? `\nHandle:\n@${props.handle}\n`
      : "";
  const badgesBlock =
    props.badges && props.badges.length > 0
      ? `\nBadges:\n${props.badges.map((b) => `• ${b}`).join("\n")}\n`
      : "";

  return `Wallet Investigation Report
Powered by BlockID

Wallet:
${props.shortAddress}${handleLine}
Trust Score:
${props.trustScore} (${tier})

Wallet Age:
${props.walletAge}

Activity Profile
Transactions: ${props.totalTx}
Unique Counterparties: ${props.uniqueCounterparties}
30D Volume: ${props.volume30d}
${badgesBlock}
Behavior Pattern
${patterns}

Analyze full report:
${url}`;
};

const buildTwitterReport = (props: ReportBuildProps) => {
  const tier = props.riskTier
    ? `${props.riskTier.charAt(0).toUpperCase()}${props.riskTier.slice(1).toLowerCase()} Risk`
    : "Unknown Risk";
  const url = `${APP_BASE_URL}/wallet/${props.walletAddress}`;
  const patterns = props.behaviorPatterns.slice(0, 3).join("\n");
  const handleOrWallet = props.handle ? `@${props.handle}` : props.shortAddress;

  return `Wallet Risk Investigation 🔎

${handleOrWallet}
Trust Score: ${props.trustScore} (${tier})

Behavior:
${patterns}

Analyze: ${url}`;
};

export const ShareInvestigationModal = ({
  open,
  onOpenChange,
  walletAddress,
  shortAddress,
  trustScore,
  riskTier,
  walletAge,
  totalTx,
  uniqueCounterparties,
  volume30d,
  behaviorPatterns,
  avatarUrl,
  bannerUrl,
  handle,
  badges = [],
  plan = "free",
  avatarType,
  onCopyReport,
  onShareTwitter,
  onShareTelegram,
}: ShareInvestigationModalProps) => {
  const reportCardRef = useRef<HTMLDivElement>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [bannerBase64, setBannerBase64] = useState<string | null>(null);

  // Strip Helius CDN proxy prefix to get direct R2 URL
  const getDirectUrl = (url: string): string => {
    const heliusPrefix = "https://cdn.helius-rpc.com/cdn-cgi/image/";
    if (url.startsWith(heliusPrefix)) {
      // Remove prefix, also handle double slash
      let direct = url.slice(heliusPrefix.length);
      // Remove leading slash if present
      while (direct.startsWith("/")) {
        direct = direct.slice(1);
      }
      // Ensure https://
      if (!direct.startsWith("https://")) {
        direct = "https://" + direct;
      }
      return direct;
    }
    return url;
  };

  useEffect(() => {
    if (!open) return;
    // Convert avatar to base64 for html2canvas
    if (avatarUrl) {
      const directAvatarUrl = getDirectUrl(avatarUrl);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            setAvatarBase64(canvas.toDataURL("image/png"));
          }
        } catch {
          setAvatarBase64(null);
        }
      };
      img.onerror = () => setAvatarBase64(null);
      img.src = directAvatarUrl;
    } else {
      setAvatarBase64(null);
    }
    // Convert banner to base64 for html2canvas
    if (bannerUrl) {
      const directBannerUrl = getDirectUrl(bannerUrl);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            setBannerBase64(canvas.toDataURL("image/png"));
          }
        } catch {
          setBannerBase64(null);
        }
      };
      img.onerror = () => setBannerBase64(null);
      img.src = directBannerUrl;
    } else {
      setBannerBase64(null);
    }
  }, [open, avatarUrl, bannerUrl]);

  const handleDownloadImage = async () => {
    const element = reportCardRef.current;
    if (!element) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        backgroundColor: "#0a0a0b",
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `blockid-investigation-${shortAddress.replace(/\.\.\./g, "-")}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to generate image:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Investigation Report</DialogTitle>
          <DialogDescription>
            Copy the report, share to social, or download as an image.
          </DialogDescription>
        </DialogHeader>

        {/* Report card preview & image capture target */}
        <div
          ref={reportCardRef}
          className="w-full max-w-sm mx-auto rounded-xl bg-zinc-950 border border-zinc-800 text-white overflow-hidden"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          {/* Banner */}
          <div
            className="w-full h-20"
            style={{
              background: bannerBase64
                ? `url(${bannerBase64}) center/cover no-repeat`
                : bannerUrl
                  ? `url(${bannerUrl}) center/cover no-repeat`
                  : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            }}
          />

          {/* Avatar + Name row */}
          <div className="px-5 -mt-6 mb-3">
            <div className="flex items-end gap-3">
              {avatarBase64 || avatarUrl ? (
                avatarType === "NFT" ? (
                  <img
                    src={avatarBase64 ?? avatarUrl ?? ""}
                    alt="avatar"
                    className="w-12 h-12 object-cover"
                    crossOrigin="anonymous"
                    style={{
                      borderRadius: "6px",
                      border: "2px solid gold",
                      boxShadow: "0 0 8px rgba(255,215,0,0.5)",
                    }}
                  />
                ) : (
                  <img
                    src={avatarBase64 ?? avatarUrl ?? ""}
                    alt="avatar"
                    className="w-12 h-12 rounded-full border-2 border-zinc-950 object-cover"
                    crossOrigin="anonymous"
                  />
                )
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-zinc-950 bg-zinc-700 flex items-center justify-center text-lg font-bold text-white">
                  {(handle ?? shortAddress ?? "?")[0]?.toUpperCase()}
                </div>
              )}
              <div className="pb-1">
                <p className="text-sm font-bold text-white leading-tight">
                  {handle ? `@${handle}` : shortAddress}
                </p>
                {handle && (
                  <p className="text-[10px] text-zinc-500 font-mono">{shortAddress}</p>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 space-y-3 text-sm">
            {/* Score + Risk Tier */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-base font-bold ${
                    trustScore >= 70
                      ? "border-green-500 text-green-400"
                      : trustScore >= 40
                        ? "border-amber-500 text-amber-400"
                        : "border-red-500 text-red-400"
                  }`}
                >
                  {trustScore}
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase">Trust Score</p>
                  <p className="text-xs font-medium">
                    {riskTier
                      ? `${riskTier.charAt(0).toUpperCase()}${riskTier.slice(1).toLowerCase()} Risk`
                      : "Unknown"}
                  </p>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-zinc-500 text-[10px] uppercase">Wallet Age</p>
                <p className="text-xs">{walletAge}</p>
              </div>
            </div>

            {/* Badges */}
            {badges && badges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {badges.slice(0, 5).map((badge, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/15 text-primary border border-primary/20"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Activity */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-800">
              <div className="text-center">
                <p className="text-zinc-500 text-[10px] uppercase">Transactions</p>
                <p className="text-xs font-semibold">{totalTx}</p>
              </div>
              <div className="text-center">
                <p className="text-zinc-500 text-[10px] uppercase">Counterparties</p>
                <p className="text-xs font-semibold">{uniqueCounterparties}</p>
              </div>
              <div className="text-center">
                <p className="text-zinc-500 text-[10px] uppercase">30D Volume</p>
                <p className="text-xs font-semibold">{volume30d}</p>
              </div>
            </div>

            {/* Behavior Pattern */}
            <div>
              <p className="text-zinc-500 text-[10px] uppercase mb-1.5">Behavior Pattern</p>
              <ul className="space-y-1">
                {behaviorPatterns.slice(0, 4).map((p, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <span className="text-primary">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-primary">ID</span>
                </div>
                <span className="text-[10px] text-zinc-500">blockidscore.fun</span>
              </div>
              <span className="text-[10px] text-zinc-600">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="gap-2" onClick={onCopyReport}>
            <Copy className="w-4 h-4" />
            Copy Report
          </Button>
          <Button variant="outline" className="gap-2" onClick={onShareTwitter}>
            <span className="w-4 h-4 text-center">𝕏</span>
            Share to Twitter
          </Button>
          <Button variant="outline" className="gap-2" onClick={onShareTelegram}>
            <span className="text-xs font-medium">TG</span>
            Share to Telegram
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadImage}>
            <Download className="w-4 h-4" />
            Download Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { buildFullReport, buildTwitterReport };
