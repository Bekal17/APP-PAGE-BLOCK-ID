/**
 * Format a handle for display.
 * handle_type = 'block' → @handle.Block
 * handle_type = 'nft' or null → @handle
 * no handle → null
 */
export const formatHandle = (
  handle?: string | null,
  handleType?: string | null
): string | null => {
  if (!handle) return null;
  if (handleType === "block") return `@${handle}.Block`;
  return `@${handle}`;
};
