import React from "react";

interface Props {
  actions: string[];
}

export default function ActionPanel({ actions }: Props) {
  if (actions.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-2">Recommended actions</h3>
      <ul className="space-y-2 list-none p-0 m-0">
        {actions.map((action, i) => (
          <li
            key={i}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-muted-foreground"
          >
            {action}
          </li>
        ))}
      </ul>
    </div>
  );
}
