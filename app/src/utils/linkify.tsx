import React from "react";

const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;
const HANDLE_REGEX = /@([a-zA-Z0-9_]{1,50})/g;

export function linkifyContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];

  const combined = new RegExp(
    `(${URL_REGEX.source})|(${HANDLE_REGEX.source})`,
    "gi"
  );

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{text.slice(lastIndex, match.index)}</span>
      );
    }

    const fullMatch = match[0];

    if (fullMatch.startsWith("http")) {
      let url = fullMatch;
      while (url && /[.,;:!?)>\]}]$/.test(url)) {
        url = url.slice(0, -1);
      }
      parts.push(
        <a
          key={key++}
          href={url}
          target={url.includes("app.blockidscore.fun") ? undefined : "_blank"}
          rel={
            url.includes("app.blockidscore.fun")
              ? undefined
              : "noopener noreferrer"
          }
          onClick={(e) => e.stopPropagation()}
          className="text-primary hover:underline break-all"
        >
          {url}
        </a>
      );
      lastIndex = match.index + fullMatch.length;
    } else if (fullMatch.startsWith("@")) {
      const handle = fullMatch.slice(1);
      parts.push(
        <a
          key={key++}
          href={`/profile/${handle}`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            window.location.href = `/profile/${handle}`;
          }}
          className="text-primary font-medium hover:underline cursor-pointer"
        >
          @{handle}
        </a>
      );
      lastIndex = match.index + fullMatch.length;
    }
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={key++}>{text.slice(lastIndex)}</span>
    );
  }

  return parts.length > 0 ? parts : [text];
}
