import { ExternalLink } from "lucide-react";

interface LinkPreviewCardProps {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function LinkPreviewCard({
  url,
  title,
  description,
  image,
}: LinkPreviewCardProps) {
  if (!title && !description) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="block mt-2 rounded-xl border border-border overflow-hidden
        hover:bg-muted/20 transition-colors group"
    >
      {image && (
        <div className="w-full h-32 overflow-hidden bg-zinc-800">
          <img
            src={image}
            alt={title || "Link preview"}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <ExternalLink className="w-3 h-3" />
          <span>{getDomain(url)}</span>
        </div>
        {title && (
          <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </a>
  );
}
