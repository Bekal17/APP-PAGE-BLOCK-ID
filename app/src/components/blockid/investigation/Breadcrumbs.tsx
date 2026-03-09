import React from "react";

interface Props {
  walletHistory: string[];
  onSelectWallet: (wallet: string) => void;
}

function shortenWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export default function Breadcrumbs({ walletHistory, onSelectWallet }: Props) {
  if (walletHistory.length === 0) return null;

  return (
    <div className="mb-4 text-gray-400">
      <nav className="flex items-center gap-2 text-sm" aria-label="Wallet navigation">
        {walletHistory.map((wallet, i) => {
          const isLast = i === walletHistory.length - 1;
          const shortWallet = shortenWallet(wallet);

          return (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-gray-500">&gt;</span>}
              {isLast ? (
                <span className="text-foreground font-medium" title={wallet}>
                  {shortWallet}
                </span>
              ) : (
                <button
                  type="button"
                  className="text-cyan-400 hover:underline cursor-pointer font-mono"
                  title={wallet}
                  onClick={() => onSelectWallet(wallet)}
                >
                  {shortWallet}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}
