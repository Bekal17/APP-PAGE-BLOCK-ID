import React from "react";

interface EvidenceItem {
  tx_hash: string;
  reason: string;
  timestamp?: string;
}

interface Props {
  evidence: EvidenceItem[];
}

function shortenHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
}

export default function EvidencePanel({ evidence }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 card-hover-glow">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Evidence / Transaction Proof</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Transactions supporting detected risk signals.
        </p>
      </div>

      {evidence.length === 0 ? (
        <p className="text-sm text-muted-foreground">No supporting transaction evidence available.</p>
      ) : (
        <div className="space-y-4">
          {evidence.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-start gap-4 py-3 border-b border-zinc-800 last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground">{item.reason}</div>
                {item.timestamp && (
                  <div className="text-xs text-gray-400 mt-1">{item.timestamp}</div>
                )}
              </div>
              <a
                href={`https://solscan.io/tx/${item.tx_hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-mono text-cyan-400 hover:underline shrink-0"
                title={item.tx_hash}
              >
                {shortenHash(item.tx_hash)}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
