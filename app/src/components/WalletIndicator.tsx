import { useTranslation } from "react-i18next";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Copy, LogOut, Wallet } from "lucide-react";

const formatAddress = (address: string) => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export default function WalletIndicator() {
  const { t } = useTranslation();
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
    }
  };

  const handleLogOut = async () => {
    try {
      await disconnect();
    } catch {
      /* ignore */
    }
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "/";
  };

  if (!connected || !publicKey) {
    return (
      <Button
        onClick={() => setVisible(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Wallet className="w-4 h-4 sm:hidden" />
        <span className="hidden sm:inline">{t("common.connect_wallet")}</span>
      </Button>
    );
  }

  const fullAddress = publicKey.toBase58();
  const shortAddress = formatAddress(fullAddress);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors text-sm"
          title={t("profile.wallet")}
        >
          <>
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <span className="hidden sm:inline font-mono text-foreground">
              {shortAddress}
            </span>
            <Wallet className="w-4 h-4 sm:hidden text-foreground" />
            <svg
              className="w-4 h-4 text-muted-foreground hidden sm:block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyAddress} className="gap-2 cursor-pointer">
          <Copy className="w-4 h-4" />
          {t("common.copy_address")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void handleLogOut()}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          {t("nav.log_out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
