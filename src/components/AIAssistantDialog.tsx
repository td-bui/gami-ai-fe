import { useRef, useEffect, useCallback } from "react";
import AIAssistantHeader from "./AIAssistantHeader";
import AIAssistantMessages from "./AIAssistantMessages";
import AIAssistantInput from "./AIAssistantInput";
import { authFetch } from "@/utils/authFetch";

const PAGE_SIZE = 20;

type Message = { from: "user" | "ai"; text: string };

type Props = {
  expanded: boolean;
  chatPanelWidth: number;
  lessonId: number | null;
  lesson: any;
  onExpand: () => void;
  onClose: () => void;
  messages: Message[];
  onSend: (text: string) => void;
  loadingMore?: boolean;
  suggestionLink?: SuggestionLink; // Link to suggest problems
};

type SuggestionLink = { type: string; id: number; title?: string } | null;

export default function AIAssistantDialog({
  expanded,
  chatPanelWidth,
  lessonId,
  lesson,
  onExpand,
  onClose,
  messages,
  onSend,
  loadingMore,
  suggestionLink,
}: Props) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Lazy load conversations
  const loadMoreConversations = useCallback(
    async (pageToLoad = 0, reset = false) => {
      if (loadingMore) return;
      console.log("Entering loadMoreConversations");
      console.log("Fetching conversations:", `${apiBaseUrl}/api/ai/conversations?lessonId=${lessonId}&page=${pageToLoad}&size=${PAGE_SIZE}`);
      const res = await authFetch(
        `${apiBaseUrl}/api/ai/conversations?lessonId=${lessonId}&page=${pageToLoad}&size=${PAGE_SIZE}`
      );
      console.log("Fetch response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("Fetched conversations:", data.content);
        const newMessages = data.content
          .flatMap((item: any) => [
            { from: "user", text: item.userQuery },
            { from: "ai", text: item.aiResponse },
          ]);
        // onMessagesUpdate(reset ? newMessages : [...newMessages, ...messages]);
        // setHasMore(!data.last);
        // setPage(pageToLoad + 1);
      } else {
        console.error("Failed to fetch conversations", res.status, await res.text());
      }
    },
    [apiBaseUrl, lessonId, loadingMore]
  );

  // Fetch initial conversations when lessonId changes
  useEffect(() => {
    if (lessonId) {
      // onMessagesUpdate([]);
      // setPage(0);
      // setHasMore(true);
      loadMoreConversations(0, true);
    }
    // eslint-disable-next-line
  }, [lessonId]);

  // Streaming send
  const handleSend = async (text: string) => {
    // onMessagesUpdate((prev) => [...prev, { from: "user", text }]);
    const userId = await localStorage.getItem("userId");
    const jwtToken = await localStorage.getItem("token"); // <-- get your JWT token from storage
    const aiBaseUrl = process.env.NEXT_PUBLIC_AI_BASE_URL;
    const response = await fetch(`${aiBaseUrl}/api/ai/orchestrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`, // <-- add JWT here
      },
      body: JSON.stringify({
        userInput: text,
        extra: {
          user_id: userId,
          lesson_id: lessonId,
          topic: lesson?.title || "",
        },
      }),
    });

    if (!response.body) return;
    const reader = response.body.getReader();
    let aiText = "";
    // onMessagesUpdate((prev) => [...prev, { from: "ai", text: "" }]);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      aiText += chunk;
      // onMessagesUpdate((prev) => {
      //   const updated = [...prev];
      //   updated[updated.length - 1] = { from: "ai", text: aiText };
      //   return updated;
      // });
    }
  };

  // Scroll handler for lazy load (same as before)
  useEffect(() => {
    if (!messagesRef.current) return;
    const handleScroll = () => {
      if (messagesRef.current!.scrollTop === 0 && !loadingMore) {
        loadMoreConversations();
      }
    };
    const ref = messagesRef.current;
    ref.addEventListener("scroll", handleScroll);
    return () => ref.removeEventListener("scroll", handleScroll);
  }, [loadingMore, loadMoreConversations]);

  return (
    <div
      className="bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col"
      style={{
        position: expanded ? "relative" : "fixed",
        right: expanded ? undefined : 24,
        bottom: expanded ? undefined : 24,
        zIndex: 50,
        width: expanded ? `${chatPanelWidth}%` : "23rem",
        height: expanded ? "100%" : "60%",
        minHeight: expanded ? "0" : "300px",
        maxHeight: expanded ? "none" : "70vh",
        transition: "width 0.2s, height 0.2s, right 0.2s, bottom 0.2s",
        display: "flex",
      }}
    >
      <AIAssistantHeader expanded={expanded} onExpand={onExpand} onClose={onClose} />
      <div
        ref={messagesRef}
        className="flex-1 p-4 w-full overflow-y-auto text-sm text-gray-600"
        style={{
          minHeight: 120,
          // overflowX: "hidden",           // Prevent horizontal scroll
          // wordBreak: "break-word",       // Break long words
          // whiteSpace: "pre-wrap",        // Preserve line breaks and wrap
        }}
      >
        {loadingMore && (
          <div className="flex justify-center items-center py-2">
            <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-400"></span>
          </div>
        )}
        <AIAssistantMessages messages={messages} suggestionLink={suggestionLink} />
      </div>
      <AIAssistantInput onSend={onSend} />
    </div>
  );
}