import React from "react";

interface Props {
  badges: string[];
}

export default function BadgesPanel({ badges }: Props) {
  if (badges.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Badges</h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge, i) => (
          <span
            key={i}
            className="bg-zinc-800 text-xs rounded-lg px-2 py-1 text-muted-foreground"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
