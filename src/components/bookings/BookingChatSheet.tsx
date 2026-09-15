import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getBookingChat } from "@/services/bookingsApi";
import type { Booking } from "@/types/api";
import type { ChatMessage, ChatParticipant } from "@/types/api";
import { getBookingDisplayId } from "@/lib/bookingUtils";
import { cn } from "@/lib/utils";

interface BookingChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getParticipantName(participant: ChatParticipant | null | undefined) {
  if (!participant) return "Unknown";
  const full = `${participant.firstName ?? ""} ${participant.lastName ?? ""}`.trim();
  return full || participant.email || "Unknown";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getSenderId(sender: ChatMessage["sender"]) {
  if (typeof sender === "string") return sender;
  return sender.id ?? sender._id ?? "";
}

function normalizeMessage(message: ChatMessage & { _id?: string }) {
  return {
    ...message,
    id: message.id || message._id || "",
    createdAt: new Date(message.createdAt),
    updatedAt: new Date(message.updatedAt),
  };
}

function ParticipantChip({
  participant,
  role,
  align,
}: {
  participant: ChatParticipant | null;
  role: string;
  align: "customer" | "vendor";
}) {
  const name = getParticipantName(participant);

  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-0 flex-1",
        align === "vendor" ? "flex-row-reverse text-right" : ""
      )}
    >
      <Avatar className="h-9 w-9 shrink-0 border border-border">
        {participant?.profileImageUrl ? (
          <AvatarImage src={participant.profileImageUrl} alt={name} />
        ) : null}
        <AvatarFallback
          className={cn(
            "text-xs font-semibold",
            align === "vendor" ? "bg-[#FF71AA]/15 text-[#FF71AA]" : "bg-muted text-muted-foreground"
          )}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{role}</p>
        <p className="text-sm font-medium text-foreground truncate capitalize">{name}</p>
        {participant?.email && (
          <p className="text-xs text-muted-foreground truncate">{participant.email}</p>
        )}
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-medium text-muted-foreground shrink-0">
        {formatDateLabel(date)}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function ChatMessageBubble({
  message,
  isVendor,
  senderName,
}: {
  message: ReturnType<typeof normalizeMessage>;
  isVendor: boolean;
  senderName: string;
}) {
  if (message.isDeleted) {
    return (
      <div className={cn("flex", isVendor ? "justify-end" : "justify-start")}>
        <div className="max-w-[min(92%,20rem)] px-3 py-2 rounded-2xl bg-muted text-muted-foreground text-sm italic">
          Message deleted
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", isVendor ? "justify-end" : "justify-start")}>
      <div className="max-w-[min(92%,20rem)] sm:max-w-[75%]">
        {!isVendor && (
          <p className="text-[11px] text-muted-foreground mb-1 px-1 capitalize">{senderName}</p>
        )}
        <div
          className={cn(
            "px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-[13px] sm:text-[14px] font-medium",
            isVendor
              ? "bg-[#FF71AA] text-white rounded-br-sm"
              : "bg-[#FAFAFA] dark:bg-muted text-[#3B3B3B] dark:text-foreground rounded-bl-md border border-border/60"
          )}
        >
          {message.type === "image" && message.imageUrl && (
            <a
              href={message.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-1"
            >
              <img
                src={message.imageUrl}
                alt=""
                className="rounded-lg max-w-full max-h-40 sm:max-h-48 object-cover"
              />
            </a>
          )}
          {message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
          {message.imageCaption && (
            <p className={cn("text-[12px] mt-1", isVendor ? "text-white/90" : "text-muted-foreground")}>
              {message.imageCaption}
            </p>
          )}
          <p className={cn("text-[11px] mt-1", isVendor ? "text-white/80" : "text-muted-foreground")}>
            {formatTime(message.createdAt)}
          </p>
        </div>
        {isVendor && (
          <p className="text-[11px] text-muted-foreground mt-1 px-1 text-right capitalize">
            {senderName}
          </p>
        )}
      </div>
    </div>
  );
}

export function BookingChatSheet({ open, onOpenChange, booking }: BookingChatSheetProps) {
  const reference = booking ? getBookingDisplayId(booking) : "";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottomRef = useRef(false);
  const scrollAdjustRef = useRef<{ prevScrollHeight: number; prevScrollTop: number } | null>(null);
  const [loadedPage, setLoadedPage] = useState(1);
  const [olderMessages, setOlderMessages] = useState<ReturnType<typeof normalizeMessage>[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const limit = 30;

  useEffect(() => {
    if (open) {
      setLoadedPage(1);
      setOlderMessages([]);
      shouldScrollToBottomRef.current = true;
    }
  }, [open, reference]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["booking-chat", reference],
    queryFn: () => getBookingChat(reference, { page: 1, limit }),
    enabled: open && Boolean(reference),
    retry: 1,
  });

  const chatData = data?.data;
  const vendorId = chatData?.participants.vendor?.id ?? chatData?.participants.vendor?._id ?? "";

  const currentPageMessages = useMemo(
    () => (chatData?.messages ?? []).map(normalizeMessage),
    [chatData?.messages]
  );

  const messages = useMemo(() => {
    const combined = [...olderMessages, ...currentPageMessages];
    const seen = new Set<string>();
    return combined.filter((message) => {
      if (seen.has(message.id)) return false;
      seen.add(message.id);
      return true;
    });
  }, [olderMessages, currentPageMessages]);

  const totalPages = chatData?.meta?.totalPages ?? 1;
  const hasOlderPages = loadedPage < totalPages;

  const loadOlderMessages = useCallback(async () => {
    if (!reference || loadingOlder || !hasOlderPages) return;

    const pageToLoad = loadedPage + 1;
    const container = scrollContainerRef.current;
    if (container) {
      scrollAdjustRef.current = {
        prevScrollHeight: container.scrollHeight,
        prevScrollTop: container.scrollTop,
      };
    }

    setLoadingOlder(true);
    try {
      const response = await getBookingChat(reference, { page: pageToLoad, limit });
      const fetched = (response.data?.messages ?? []).map(normalizeMessage);
      if (fetched.length) {
        setOlderMessages((prev) => [...fetched, ...prev]);
      } else {
        scrollAdjustRef.current = null;
      }
      setLoadedPage(pageToLoad);
    } finally {
      setLoadingOlder(false);
    }
  }, [reference, loadingOlder, hasOlderPages, loadedPage, limit]);

  useLayoutEffect(() => {
    const adjust = scrollAdjustRef.current;
    const container = scrollContainerRef.current;
    if (!adjust || !container) return;

    container.scrollTop = container.scrollHeight - adjust.prevScrollHeight + adjust.prevScrollTop;
    scrollAdjustRef.current = null;
  }, [olderMessages]);

  useEffect(() => {
    if (!open || isLoading || !messages.length || scrollAdjustRef.current) return;

    if (shouldScrollToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      shouldScrollToBottomRef.current = false;
    }
  }, [open, isLoading, messages.length]);

  const renderMessages = useMemo(() => {
    const items: ReactNode[] = [];
    let lastDate: Date | null = null;

    messages.forEach((message) => {
      if (!lastDate || !isSameDay(lastDate, message.createdAt)) {
        items.push(<DateDivider key={`date-${message.createdAt.toISOString()}`} date={message.createdAt} />);
        lastDate = message.createdAt;
      }

      const senderId = getSenderId(message.sender);
      const isVendor = Boolean(vendorId && senderId === vendorId);
      const senderName = isVendor
        ? getParticipantName(chatData?.participants.vendor)
        : getParticipantName(chatData?.participants.customer);

      items.push(
        <ChatMessageBubble
          key={message.id}
          message={message}
          isVendor={isVendor}
          senderName={senderName}
        />
      );
    });

    return items;
  }, [messages, vendorId, chatData?.participants]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0 h-[calc(100dvh-1.5rem)] m-3 rounded-md overflow-hidden"
      >
        <SheetHeader className="shrink-0 px-4 pt-6 pb-3 border-b border-border space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 shrink-0" />
            Booking chat
          </SheetTitle>
          <SheetDescription>
            {(chatData?.booking.displayId ?? reference) || "Conversation between customer and provider"}
          </SheetDescription>
        </SheetHeader>

        {chatData && (
          <div className="shrink-0 px-4 py-3 border-b border-border bg-muted/20">
            <div className="flex items-start justify-between gap-3">
              <ParticipantChip
                participant={chatData.participants.customer}
                role="Customer"
                align="customer"
              />
              <div className="w-px self-stretch bg-border shrink-0 mx-1" />
              <ParticipantChip
                participant={chatData.participants.vendor}
                role="Provider"
                align="vendor"
              />
            </div>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 flex flex-col gap-2 sm:gap-3"
        >
          {isLoading ? (
            <div className="flex flex-col gap-3 py-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={cn("flex", index % 2 === 0 ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "h-12 rounded-2xl bg-muted",
                      index % 2 === 0 ? "w-56 rounded-bl-md" : "w-48 rounded-br-sm"
                    )}
                  />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">Could not load chat</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error instanceof Error ? error.message : "Something went wrong"}
              </p>
            </div>
          ) : (
            <>
              {hasOlderPages && (
                <div className="text-center pb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={loadingOlder}
                    onClick={loadOlderMessages}
                    className="text-primary h-8 text-xs"
                  >
                    {loadingOlder ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      "Load older messages"
                    )}
                  </Button>
                </div>
              )}

              {!chatData?.chat && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-12 text-center px-4">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MessageSquare className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                    This customer and provider have not started a conversation for this booking.
                  </p>
                </div>
              ) : (
                renderMessages
              )}

              {isFetching && !isLoading && (
                <p className="text-center text-xs text-muted-foreground">Refreshing…</p>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="shrink-0 px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-center text-muted-foreground">
            Admin view — read only. {messages.length > 0 ? `${messages.length} message${messages.length === 1 ? "" : "s"} shown` : ""}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
