import React from "react";

interface TimelineEvent {
  time?: string;
  date?: string;
  event: string;
  counterparty?: string;
  risk_level?: string;
}

interface Props {
  events: TimelineEvent[];
}

export default function TransactionTimeline({ events }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 card-hover-glow">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Transaction Timeline</h3>
        <p className="text-xs text-gray-400 mt-0.5">Chronological wallet activity.</p>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No transaction events detected.</p>
      ) : (
        <div className="relative">
          {events.map((evt, i) => (
            <div
              key={i}
              className="flex gap-3 items-start pb-4 last:pb-0 border-b border-zinc-800 last:border-b-0"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="text-xs text-gray-400">{evt.date ?? evt.time}</div>
                <div className="text-sm text-foreground">{evt.event}</div>
                {evt.counterparty && (
                  <div className="text-xs text-muted-foreground font-mono">{evt.counterparty}</div>
                )}
                {evt.risk_level && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Risk: </span>
                    <span
                      className={
                        evt.risk_level.toUpperCase() === "HIGH"
                          ? "text-red-500"
                          : evt.risk_level.toUpperCase() === "MEDIUM"
                            ? "text-amber-500"
                            : "text-green-500"
                      }
                    >
                      {evt.risk_level}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
