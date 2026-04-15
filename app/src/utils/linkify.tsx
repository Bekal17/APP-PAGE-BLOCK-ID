import React from "react";

const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

/**
 * Convert plain text to React elements with clickable links.
 * URLs become <a> tags, rest stays as text.
 */
export function linkifyContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const regex = new RegExp(URL_REGEX.source, "gi");

  while ((match = regex.exec(text)) !== null) {
    // Text before the URL
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    let url = match[0];
    // Clean trailing punctuation
    while (url && /[.,;:!?)>\]}]$/.test(url)) {
      url = url.slice(0, -1);
    }

    parts.push(
      <a
        key={key++}
        href={url}
        target={url.includes("app.blockidscore.fun") ? undefined : "_blank"}
        rel={url.includes("app.blockidscore.fun") ? undefined : "noopener noreferrer"}
        onClick={(e) => e.stopPropagation()}
        className="text-primary hover:underline break-all"
      >
        {url}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last URL
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
