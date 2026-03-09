import { useRef } from "react";
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
  onCopyReport: () => void;
  onShareTwitter: () => void;
  onShareTelegram: () => void;
}

const buildFullReport = (props: Omit<ShareInvestigationModalProps, "open" | "onOpenChange" | "onCopyReport" | "onShareTwitter" | "onShareTelegram">) => {
  const tier = props.riskTier ? `${props.riskTier.charAt(0).toUpperCase()}${props.riskTier.slice(1).toLowerCase()} Risk` : "Unknown Risk";
  const url = `${APP_BASE_URL}/wallet/${props.walletAddress}`;
  const patterns = props.behaviorPatterns.map((p) => `• ${p}`).join("\n");

  return `Wallet Investigation Report
Powered by BlockID

Wallet:
${props.shortAddress}

Trust Score:
${props.trustScore} (${tier})

Wallet Age:
${props.walletAge}

Activity Profile
Transactions: ${props.totalTx}
Unique Counterparties: ${props.uniqueCounterparties}
30D Volume: ${props.volume30d}

Behavior Pattern
${patterns}

Analyze full report:
${url}`;
};

const buildTwitterReport = (props: Omit<ShareInvestigationModalProps, "open" | "onOpenChange" | "onCopyReport" | "onShareTwitter" | "onShareTelegram">) => {
  const tier = props.riskTier ? `${props.riskTier.charAt(0).toUpperCase()}${props.riskTier.slice(1).toLowerCase()} Risk` : "Unknown Risk";
  const url = `${APP_BASE_URL}/wallet/${props.walletAddress}`;
  const patterns = props.behaviorPatterns.slice(0, 3).join("\n");

  return `Wallet Risk Investigation 🔎

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
  onCopyReport,
  onShareTwitter,
  onShareTelegram,
}: ShareInvestigationModalProps) => {
  const reportCardRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    const element = reportCardRef.current;
    if (!element) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(element, {
        backgroundColor: "#0a0a0b",
        scale: 2,
        useCORS: true,
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
          className="w-full max-w-sm mx-auto p-5 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              ID
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">BlockID</p>
              <p className="text-sm font-semibold">Wallet Investigation Report</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-zinc-500 text-xs uppercase">Wallet</p>
              <p className="font-mono text-base">{shortAddress}</p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-zinc-500 text-xs uppercase">Trust Score</p>
                <p className="text-lg font-semibold text-primary">{trustScore}</p>
              </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase">Risk Tier</p>
                  <p className="font-medium">
                    {riskTier ? `${riskTier.charAt(0).toUpperCase()}${riskTier.slice(1).toLowerCase()} Risk` : "Unknown Risk"}
                  </p>
                </div>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase">Wallet Age</p>
              <p>{walletAge}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase mb-2">Behavior Pattern</p>
              <ul className="space-y-1">
                {behaviorPatterns.slice(0, 4).map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-zinc-600 pt-2">blockidscore.fun</p>
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
