"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import LessonContent from "@/components/LessonContent";
import AIAssistantDialog from "@/components/AIAssistantDialog";
import AIAssistantButton from "@/components/AIAssistantButton";
import DashboardLayout from "../layout";
import { authFetch } from "@/utils/authFetch";

type Message = {
  from: "user" | "ai";
  text: string;
};

const PAGE_SIZE = 20;

type LessonPageProps = {
  lessonId?: number | null;
};

const LessonPage = () => {
  const searchParams = useSearchParams();
  const lessonIdParam = searchParams.get("id");
  const lessonId = lessonIdParam ? Number(lessonIdParam) : null;

  const [lesson, setLesson] = useState<any>(null);
  const [modulesLessons, setModulesLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(lessonId);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantExpanded, setAssistantExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [editorPanelWidth, setEditorPanelWidth] = useState(40); // percent
  const [chatPanelWidth, setChatPanelWidth] = useState(30); // percent
  const [dragChatDivider, setDragChatDivider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const courseId = 1; // Make dynamic as Go
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const aiBaseUrl = process.env.NEXT_PUBLIC_AI_BASE_URL;
  const [suggestionLink, setSuggestionLink] = useState<{type: string, id: number, title?: string} | null>(null);

  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const currentUserLevel = typeof window !== "undefined" ? localStorage.getItem("level") : null;

  // Fetch all modules and lessons for sidebar
  useEffect(() => {
    const fetchModulesLessons = async () => {
      const res = await authFetch(`${apiBaseUrl}/api/courses/${courseId}/modules-lessons`);
      if (res.ok) {
        const data = await res.json();
        setModulesLessons(data);
        // Auto-select the first lesson if not selected
        if (data.length > 0 && !selectedLessonId) {
          setSelectedLessonId(data[0].lessonId);
        }
      }
    };
    fetchModulesLessons();
    // eslint-disable-next-line
  }, [courseId]);

  // Fetch lesson detail when selectedLessonId changes
  useEffect(() => {
    if (!selectedLessonId) return;
    const fetchLesson = async () => {
      const res = await authFetch(`${apiBaseUrl}/api/lessons/${selectedLessonId}/detail`);
      if (res.ok) {
        const data = await res.json();
        setLesson(data);
      } else {
        setLesson(null);
      }
    };
    fetchLesson();
  }, [selectedLessonId]);

  // Adjust panel widths based on assistant expansion
  useEffect(() => {
    if (assistantExpanded) {
      setChatPanelWidth(40);
      setEditorPanelWidth(60);
    } else {
      setChatPanelWidth(10);
      setEditorPanelWidth(90);
    }
  }, [assistantExpanded]);

  // Handle dragging the chat divider
  useEffect(() => {
    if (!dragChatDivider) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        let newEditorWidth = (x / containerRect.width) * 100;
        newEditorWidth = Math.max(20, Math.min(80, newEditorWidth)); // clamp between 20% and 80%
        setEditorPanelWidth(newEditorWidth);
        setChatPanelWidth(100 - newEditorWidth);
      }
    };
    const handleMouseUp = () => setDragChatDivider(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragChatDivider]);

  // Fetch initial conversations when assistant opens or lesson changes
  useEffect(() => {
    if (selectedLessonId) {
      setMessages([]); // reset
      setPage(0);
      setHasMore(true);
      loadMoreConversations(0, true);
    }
    // eslint-disable-next-line
  }, [selectedLessonId]);

  // If you want to update selectedLessonId when prop changes:
  useEffect(() => {
    const lessonIdNum = lessonIdParam ? Number(lessonIdParam) : null;
    if (lessonIdNum && lessonIdNum !== selectedLessonId) {
      setSelectedLessonId(lessonIdNum);
    }
  }, [lessonIdParam, selectedLessonId]);

  // Lazy load conversations
  const loadMoreConversations = useCallback(async (pageToLoad = page, reset = false) => {
    setLoadingMore(true);
    const res = await authFetch(
      `${apiBaseUrl}/api/ai/conversations?lessonId=${selectedLessonId}&page=${pageToLoad}&size=${PAGE_SIZE}`
    );
    if (res.ok) {
      const data = await res.json();
      const newMessages = data.content
        .flatMap((item: any) => [
          { from: "user", text: item.userQuery },
          { from: "ai", text: item.aiResponse }
        ])
      setMessages(prev =>
        reset ? newMessages : [...newMessages, ...prev]
      );
      setHasMore(!data.last);
      setPage(pageToLoad + 1);
    }
    setLoadingMore(false);
  }, [apiBaseUrl, selectedLessonId, page]);

  // Handle sending a new message (streaming)
  const handleSend = async (text: string) => {
    setMessages(prev => [...prev, { from: "user", text }]);
    // Streaming fetch
    const response = await authFetch(`${aiBaseUrl}/api/ai/orchestrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput: text,
        extra: {
          "lesson_id": selectedLessonId,
          topic: lesson?.title || "",
          user_id: currentUserId,         // <-- Add this (get from your auth/session)
          user_level: currentUserLevel    // <-- Add this (get from user profile/progress)
        }
      })
    });
    if (!response.body) return;
    const reader = response.body.getReader();
    let aiText = "";
    setMessages(prev => [...prev, { from: "ai", text: "" }]);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      aiText += chunk;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { from: "ai", text: aiText };
        return updated;
      });
    }
  };

  // After streaming is done, check if the last AI message is a suggestion object
  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.from === "ai") {
      try {
        const obj = JSON.parse(lastMsg.text);
        if (obj && obj.type && obj.id) {
          setSuggestionLink({
            type: obj.type,
            id: obj.id,
            title: obj.title || ""
          });
        } else {
          setSuggestionLink(null);
        }
      } catch {
        setSuggestionLink(null);
      }
    }
  }, [messages]);

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <div
        style={{
          flexBasis: "22%",
          height: "100%",
        }}
        className="min-h-0"
      >
        <Sidebar
          modulesLessons={modulesLessons}
          onLessonSelect={setSelectedLessonId}
          selectedLessonId={selectedLessonId}
        />
      </div>
      {/* Main Content */}
      <div
        style={{
          flexBasis: "78%",
          minWidth: 0,
          overflow: "hidden",
          height: "100%",
        }}
        className="flex h-full min-h-0"
        ref={containerRef}
      >
        {/* Code Editor */}
        <div
          style={{
            flexBasis: `${editorPanelWidth}%`,
            minWidth: 300,
            transition: "flex-basis 0.2s",
            height: "100%",
            overflow: "auto",
          }}
          className="relative"
        >
          <main className="p-8 max-w-4xl mx-auto">
            {lesson ? (
              <LessonContent lesson={lesson} />
            ) : (
              <div className="flex justify-center items-center min-h-screen">
                <div className="text-gray-500 text-lg">Loading lesson...</div>
              </div>
            )}
          </main>
        </div>
        {/* Divider */}
        {showAssistant && assistantExpanded && (
          <div
            className="w-2 cursor-col-resize bg-gray-200 hover:bg-gray-400 transition flex items-center justify-center select-none"
            onMouseDown={() => setDragChatDivider(true)}
            style={{ zIndex: 10, transition: "background 0.2s" }}
            title="Drag to resize"
          >
            <span className="w-1 h-8 bg-gray-400 rounded-full block" />
          </div>
        )}
        <div
          style={{
            flexBasis: `${chatPanelWidth}%`,
            minWidth: assistantExpanded ? 350 : 200,
            height: "100%",
            borderLeft: "1px solid #e5e7eb",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            zIndex: 20,
            transition: "flex-basis 0.2s, min-width 0.2s",
          }}
          className="shadow-lg"
        >
          {/* Chat Panel */}
          {showAssistant && assistantExpanded && (
            <AIAssistantDialog
              expanded={assistantExpanded}
              chatPanelWidth={100}
              lessonId={selectedLessonId}
              lesson={lesson}
              messages={messages}
              suggestionLink={suggestionLink} // <-- pass here
              onSend={handleSend}
              loadingMore={loadingMore}
              onExpand={() => setAssistantExpanded(prev => !prev)}
              onClose={() => {
                setShowAssistant(false);
                setAssistantExpanded(false);
                setEditorPanelWidth(100);
                setChatPanelWidth(0);
              }}
            />
          )}
        </div>
      </div>
      {/* Floating AI Assistant Dialog (when not expanded) */}
      {showAssistant && !assistantExpanded && (
        <div className="fixed bottom-6 right-6 z-50">
          <AIAssistantDialog
            expanded={assistantExpanded}
            chatPanelWidth={chatPanelWidth}
            lessonId={selectedLessonId}
            lesson={lesson}
            messages={messages}
            suggestionLink={suggestionLink} // <-- pass here
            onSend={handleSend}
            onExpand={() => setAssistantExpanded(true)}
            onClose={() => {
              setShowAssistant(false);
              setAssistantExpanded(false);
              setEditorPanelWidth(100);
              setChatPanelWidth(0);
            }}
          />
        </div>
      )}
      {/* Floating Button (only if not open) */}
      {!showAssistant && (
        <AIAssistantButton onClick={() => setShowAssistant(true)} />
      )}
    </div>
  );
};

export default LessonPage;

