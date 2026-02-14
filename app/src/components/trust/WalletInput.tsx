import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletInputProps {
  onSubmit: (wallet: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const WalletInput = ({ onSubmit, disabled, placeholder = "Paste Solana wallet address..." }: WalletInputProps) => {
  const [value, setValue] = useState("");
  const { toast } = useToast();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      onSubmit(trimmed);
    },
    [value, onSubmit],
  );

  const handleCopy = useCallback(() => {
    if (!value.trim()) return;
    navigator.clipboard.writeText(value.trim());
    toast({ title: "Copied", description: "Wallet address copied to clipboard." });
  }, [value, toast]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
      <div className="relative flex-1">
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10 font-mono text-sm"
          aria-label="Solana wallet address"
        />
        {value.trim() && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            aria-label="Copy address"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button type="submit" disabled={disabled || !value.trim()} className="shrink-0">
        <Search className="h-4 w-4 mr-2" />
        Get trust score
      </Button>
    </form>
  );
};

export default WalletInput;
