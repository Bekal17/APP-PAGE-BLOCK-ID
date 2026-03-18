import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeft, Send, MessageCircle, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getDMConversations,
  getDMMessages,
  sendDM,
  getSocialProfile,
} from "@/services/blockidApi";

const formatTime = (iso?: string) => {
  if (!iso) return "";
  const utcIso = iso.endsWith("Z") ? iso : iso + "Z";
  const date = new Date(utcIso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return date.toLocaleDateString();
};

const truncate = (w: string) =>
  w ? `${w.slice(0, 4)}...${w.slice(-4)}` : "";

const Messages = () => {
  const { walletParam } = useParams<{ walletParam?: string }>();
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const wallet = publicKey?.toString() ?? "";

  const [conversations, setConversations] = useState<any[]>([]);
  const [convoLoading, setConvoLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchConversations = async () => {
    if (!wallet) return;
    try {
      const data = await getDMConversations(wallet);
      setConversations(data.conversations ?? []);
    } catch {
      // ignore
    }
    setConvoLoading(false);
  };

  useEffect(() => {
    if (!wallet) {
      setConvoLoading(false);
      return;
    }
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [wallet]);

  const fetchMessages = async () => {
    if (!wallet || !walletParam) return;
    try {
      const data = await getDMMessages(wallet, walletParam);
      setMessages(data.messages ?? []);
    } catch {
      // ignore
    }
    setMsgLoading(false);
  };

  useEffect(() => {
    if (!walletParam || !wallet) return;
    setMsgLoading(true);
    setMessages([]);

    getSocialProfile(walletParam)
      .then(setOtherProfile)
      .catch(() => setOtherProfile(null));

    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [walletParam, wallet]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    if (!wallet || !walletParam || !newMessage.trim()) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        from_wallet: wallet,
        to_wallet: walletParam,
        content,
        is_mine: true,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      await sendDM(wallet, walletParam, content);
      await fetchConversations();
    } catch (e) {
      console.error("Failed to send DM", e);
    }
    setSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConvos = conversations.filter((c) =>
    !search ||
    (c.handle ?? "")
      .toLowerCase()
      .includes(search.toLowerCase()) ||
    (c.other_wallet ?? "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const otherName = otherProfile?.handle
    ? `@${otherProfile.handle}`
    : truncate(walletParam ?? "");

  if (!wallet) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mb-4 opacity-30" />
          <p>Connect your wallet to use messages</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)] flex gap-0 border border-border rounded-xl overflow-hidden">
        {/* LEFT: Conversation list */}
        <div
          className={`w-80 shrink-0 border-r border-border flex flex-col ${
            walletParam ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground mb-3">
              Messages
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convoLoading ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-lg animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted/50 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted/50 rounded w-24" />
                      <div className="h-3 bg-muted/40 rounded w-36" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConvos.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No conversations yet
              </div>
            ) : (
              filteredConvos.map((convo) => (
                <button
                  key={convo.other_wallet}
                  onClick={() =>
                    navigate(`/messages/${convo.other_wallet}`)
                  }
                  className={`w-full flex items-start gap-3 p-3 hover:bg-muted/20 transition-colors text-left ${
                    walletParam === convo.other_wallet
                      ? "bg-primary/10 border-l-2 border-primary"
                      : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {(convo.handle ?? convo.other_wallet ?? "?")[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {convo.handle
                          ? `@${convo.handle}`
                          : truncate(convo.other_wallet)}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0 ml-1">
                        {formatTime(convo.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {convo.last_message ?? "No messages"}
                    </p>
                  </div>

                  {convo.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                      {convo.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Chat area */}
        {walletParam ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="h-14 border-b border-border flex items-center gap-3 px-4 shrink-0">
              <button
                onClick={() => navigate("/messages")}
                className="md:hidden p-1 rounded-lg hover:bg-muted/30 text-muted-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {otherName[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {otherName}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {truncate(walletParam)}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                  <MessageCircle className="w-8 h-8 mb-2 opacity-20" />
                  <p>No messages yet</p>
                  <p className="text-xs mt-1">Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.is_mine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                        msg.is_mine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted/50 text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.is_mine
                            ? "text-primary-foreground/70 text-right"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-3 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send)"
                  className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none max-h-32"
                  rows={1}
                  maxLength={1000}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageCircle className="w-12 h-12 opacity-20" />
            <p className="text-sm">
              Select a conversation to start messaging
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Messages;

