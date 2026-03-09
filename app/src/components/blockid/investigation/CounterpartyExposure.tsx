import React from "react";

interface Counterparty {
  wallet: string;
  risk_tier: string;
}

interface Props {
  counterparties: Counterparty[];
  onSelectWallet: (wallet: string) => void;
}

function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    HIGH: "bg-red-500",
    MEDIUM: "bg-amber-500",
    LOW: "bg-green-500",
  };
  const r = (risk || "LOW").toUpperCase();
  return (
    <span className={`px-2 py-1 text-xs rounded text-white ${colors[r] ?? "bg-zinc-600"}`}>
      {r}
    </span>
  );
}

function shortenWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export default function CounterpartyExposure({ counterparties, onSelectWallet }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 card-hover-glow">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Counterparty Exposure</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Wallets frequently interacting with the target wallet.
        </p>
      </div>

      {counterparties.length === 0 ? (
        <p className="text-sm text-muted-foreground">No significant counterparties detected.</p>
      ) : (
        <div>
          {[...counterparties]
            .sort((a, b) => {
              const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
              const aOrder = order[(a.risk_tier || "LOW").toUpperCase()] ?? 2;
              const bOrder = order[(b.risk_tier || "LOW").toUpperCase()] ?? 2;
              return aOrder - bOrder;
            })
            .map((c, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 border-b border-zinc-800 last:border-b-0"
              >
                <button
                  type="button"
                  className="font-mono text-xs text-cyan-400 hover:underline text-left"
                  title={c.wallet}
                  onClick={() => onSelectWallet(c.wallet)}
                >
                  {c.wallet.length <= 12
                    ? c.wallet
                    : `${c.wallet.slice(0, 6)}...${c.wallet.slice(-4)}`}
                </button>
                <RiskBadge risk={c.risk_tier} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
