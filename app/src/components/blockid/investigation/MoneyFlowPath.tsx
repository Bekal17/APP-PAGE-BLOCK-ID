import React from "react";

interface PathNode {
  wallet: string;
  risk: string;
}

interface Props {
  path: PathNode[];
  onSelectWallet?: (wallet: string) => void;
}

function shortenAddress(addr: string): string {
  if (addr.length <= 8) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function getBorderColor(risk: string): string {
  const r = risk.toUpperCase();
  if (r === "HIGH") return "border-red-500";
  if (r === "MEDIUM") return "border-amber-500";
  if (r === "LOW") return "border-green-500";
  return "border-zinc-600";
}

export default function MoneyFlowPath({ path, onSelectWallet }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 card-hover-glow">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Follow the Money</h3>
        <p className="text-xs text-gray-400 mt-0.5">Transaction path analysis.</p>
      </div>

      {path.length === 0 ? (
        <p className="text-sm text-muted-foreground">No transaction flow path detected.</p>
      ) : (
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 sm:gap-2">
          {path.map((node, i) => (
            <React.Fragment key={i}>
              <button
                type="button"
                onClick={() => onSelectWallet?.(node.wallet)}
                className={`
                  rounded-xl bg-zinc-800 px-3 py-2 text-sm border-2
                  hover:bg-zinc-700 transition-colors cursor-pointer
                  text-left min-w-0
                  ${getBorderColor(node.risk)}
                `}
              >
                {shortenAddress(node.wallet)}
              </button>
              {i < path.length - 1 && (
                <span className="text-zinc-500 shrink-0" aria-hidden="true">
                  →
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
