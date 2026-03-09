import React from "react";

export default function Counterparties() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 card-hover-glow">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Counterparties</h3>
        <p className="text-xs text-gray-400 mt-0.5">Counterparty exposure analysis.</p>
      </div>
      <p className="text-sm text-muted-foreground">No counterparty data available.</p>
    </div>
  );
}
