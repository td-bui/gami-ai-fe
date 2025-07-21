"use client";
import { useState, useRef, useEffect } from "react";
import AIAssistantDialog from "@/components/AIAssistantDialog";
import AIAssistantButton from "@/components/AIAssistantButton";

export default function LessonAIAssistant() {
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantExpanded, setAssistantExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { from: "user", text: "Hi!" },
    { from: "ai", text: "Hello, how can I help?" }
  ]);
  const [editorPanelWidth, setEditorPanelWidth] = useState(70);
  const [chatPanelWidth, setChatPanelWidth] = useState(30);
  const [dragChatDivider, setDragChatDivider] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (assistantExpanded) {
      setChatPanelWidth(30);
      setEditorPanelWidth(70);
    } else {
      setChatPanelWidth(0);
      setEditorPanelWidth(100);
    }
  }, [assistantExpanded]);

  useEffect(() => {
    if (!dragChatDivider) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        let newEditorWidth = (x / containerRect.width) * 100;
        newEditorWidth = Math.max(30, Math.min(80, newEditorWidth));
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

  return (
    <>
      {/* Expanded Assistant */}
      {showAssistant && assistantExpanded && (
        <div
          ref={containerRef}
          className="fixed inset-0 flex flex-row pointer-events-none z-40"
          style={{ minWidth: 0, height: "100%", overflow: "hidden" }}
        >
          <div style={{ flexBasis: `${editorPanelWidth}%`, pointerEvents: "none" }} />
          <div
            className="w-2 cursor-col-resize bg-gray-200 hover:bg-gray-400 transition flex items-center justify-center select-none pointer-events-auto"
            onMouseDown={() => setDragChatDivider(true)}
            style={{ zIndex: 10, transition: "background 0.2s" }}
            title="Drag to resize"
          >
            <span className="w-1 h-8 bg-gray-400 rounded-full block" />
          </div>
          <div
            style={{
              flexBasis: `${chatPanelWidth}%`,
              minWidth: 250,
              maxWidth: "40vw",
              height: "100%",
              borderLeft: "1px solid #e5e7eb",
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              zIndex: 20,
              transition: "flex-basis 0.2s",
              pointerEvents: "auto"
            }}
            className="shadow-lg"
          >
            <AIAssistantDialog
              expanded={assistantExpanded}
              chatPanelWidth={chatPanelWidth}
              messages={messages}
              onExpand={() => setAssistantExpanded(prev => !prev)}
              onClose={() => {
                setShowAssistant(false);
                setAssistantExpanded(false);
                setEditorPanelWidth(100);
                setChatPanelWidth(0);
              }}
            />
          </div>
        </div>
      )}

      {/* Floating AI Assistant Dialog (when not expanded) */}
      {showAssistant && !assistantExpanded && (
        <div className="fixed bottom-6 right-6 z-50">
          <AIAssistantDialog
            expanded={assistantExpanded}
            chatPanelWidth={chatPanelWidth}
            messages={messages}
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
    </>
  );
}