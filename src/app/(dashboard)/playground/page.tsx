"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { authFetch } from "@/utils/authFetch";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/themes/prism.css";
import AIAssistantDialog from "@/components/AIAssistantDialog";
import AIAssistantButton from "@/components/AIAssistantButton";

const PlaygroundPage = () => {
  const searchParams = useSearchParams();
  const exampleId = searchParams.get("exampleId");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const aiBaseUrl = process.env.NEXT_PUBLIC_AI_BASE_URL;
  type Message = { from: "user" | "ai"; text: string };
  const [messages, setMessages] = useState<Message[]>([]);

  // Draggable divider state
  const [editorWidth, setEditorWidth] = useState(50); // percent
  const [chatPanelWidth, setChatPanelWidth] = useState(50); // percent
  const [assistantExpanded, setAssistantExpanded] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag logic for code editor/result divider (when assistant is expanded)
  useEffect(() => {
    if (!assistantExpanded) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percent = ((e.clientX - rect.left) / rect.width) * 100;
      if (assistantExpanded) {
        // Clamp so that editor + result + assistant <= 100 and each >= 15
        percent = Math.max(15, Math.min(100 - chatPanelWidth - 15, percent));
      } else {
        // Clamp between 15% and 85% when no assistant
        percent = Math.max(15, Math.min(85, percent));
      }
      setEditorWidth(percent);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
    const handleMouseDown = () => {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    };
    (window as any).__editorDividerMouseDown = handleMouseDown;
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [assistantExpanded, chatPanelWidth]);

  // Drag logic for result/assistant divider (already present)
  useEffect(() => {
    if (!assistantExpanded) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percent = ((rect.right - e.clientX) / rect.width) * 100;
      percent = Math.max(15, Math.min(60, percent)); // clamp between 15% and 60%
      setChatPanelWidth(percent);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
    const handleMouseDown = () => {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    };
    (window as any).__assistantDividerMouseDown = handleMouseDown;
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [assistantExpanded]);

  useEffect(() => {
    const fetchExample = async () => {
      if (!exampleId) return;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await authFetch(`${apiBaseUrl}/api/examples/${exampleId}`);
      if (res.ok) {
        const data = await res.json();
        setCode(data.code || "");
      }
    };
    fetchExample();
  }, [exampleId]);

  const runCode = async () => {
    setLoading(true);
    setOutput(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      // 1. Send code to backend to start execution (use authFetch)
      const runRes = await authFetch(`${apiBaseUrl}/api/examples/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const { job_id } = await runRes.json();

      // 2. Poll for result (use authFetch)
      let result = null;
      for (let i = 0; i < 50; i++) { // up to ~5 seconds
        const res = await authFetch(`${apiBaseUrl}/api/examples/result/${job_id}`);
        result = await res.json();
        if (result.status === "finished" || result.status === "failed") break;
        await new Promise(r => setTimeout(r, 100));
      }

      if (result.status === "finished") {
        if (!result.output && result.error) {
          setOutput(result.error);
        } else{
          setOutput(result.output || "No output produced.");
        } 
      } else if (result.status === "failed") {
        setOutput("Error: " + (result.error || "Job failed"));
      } else {
        setOutput("Timed out waiting for result.");
      }
    } catch (err) {
      setOutput("Error: " + (err as any).message);
    }
    setLoading(false);
  };

  // Editor/Result divider drag logic
  const handleEditorDividerMouseDown = () => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percent = ((e.clientX - rect.left) / rect.width) * 100;
      if (assistantExpanded) {
        percent = Math.max(15, Math.min(100 - chatPanelWidth - 15, percent));
      } else {
        percent = Math.max(15, Math.min(85, percent));
      }
      setEditorWidth(percent);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
  };

  useEffect(() => {
    // Try to get from localStorage first (optional, for persistence)
    let sid = localStorage.getItem("playground_session_id");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("playground_session_id", sid);
    }
    setSessionId(sid);
  }, []);
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
          session_id: sessionId,
          user_code: code,
          running_result: output, // <-- Pass running_result here
          last_agent: 'hint'
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

  return (
    <div
      id="playground-container"
      ref={containerRef}
      className="w-full h-full p-6 bg-white rounded shadow flex flex-row gap-0 min-h-[400px]"
      style={{ minHeight: 400 }}
    >
      {/* Code Editor Panel */}
      <div
        className="flex flex-col pr-4 h-full"
        style={{
          width: `${editorWidth}%`,
          minWidth: 100,
          transition: "width 0.2s",
        }}
      >
        {/* Header row with title and Run button */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold" style={{ color: "#7c3aed" }}>
            Python Playground
          </h1>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded font-semibold ml-4"
            onClick={runCode}
            disabled={loading}
          >
            {loading ? "Running..." : "Run Code"}
          </button>
        </div>
        <div className="flex-1 mb-2 min-h-[300px] overflow-auto">
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={code => Prism.highlight(code, Prism.languages.python, "python")}
            padding={16}
            className="font-mono text-sm rounded bg-gray-50"
            style={{
              minHeight: "300px",
              background: "#f8fafc",
              borderRadius: "8px",
              fontSize: "1em",
              outline: "none",
              height: "100%",
              overflow: "auto",
            }}
            textareaId="code-editor"
            textareaClassName="focus:outline-none"
            spellCheck={false}
          />
        </div>
      </div>
      {/* Draggable Divider between editor and result (only when assistant expanded) */}
        <div
          className="bg-gray-300 mx-2 rounded cursor-col-resize"
          style={{ width: 6, minWidth: 6, height: "100%", zIndex: 30 }}
          onMouseDown={handleEditorDividerMouseDown}
          title="Drag to resize"
        />
      {/* Result Panel */}
      <div
        className="flex flex-col pl-4 h-full"
        style={{
          width: assistantExpanded
            ? `${100 - editorWidth - chatPanelWidth}%`
            : `${100 - editorWidth}%`,
          minWidth: 100,
          transition: "width 0.2s",
        }}
      >
        <h2 className="text-2xl font-extrabold mb-4" style={{ color: "#7c3aed" }}>
          Result
        </h2>
        <div className="flex-1 bg-black p-4 rounded font-mono text-green-400 whitespace-pre-wrap overflow-auto shadow-inner min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center w-full mt-8">
              <svg
                className="animate-spin h-16 w-16 text-purple-500 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <span className="text-lg text-purple-300 font-bold">Running...</span>
            </div>
          ) : output ? (
            output
          ) : (
            <span className="text-gray-400">No output yet.</span>
          )}
        </div>
      </div>
      {/* Draggable Divider & Assistant Panel */}
      {showAssistant && assistantExpanded && (
        <>
          {/* Divider between result and assistant */}
          <div
            className="bg-gray-300 mx-2 rounded cursor-col-resize"
            style={{ width: 6, minWidth: 6, height: "100%", zIndex: 30 }}
            onMouseDown={() => (window as any).__assistantDividerMouseDown()}
            title="Drag to resize"
          />
          {/* Assistant Panel */}
          <div
            style={{
              flexBasis: `${chatPanelWidth}%`,
              minWidth: 250,
              height: "100%",
              borderLeft: "1px solid #e5e7eb",
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              zIndex: 20,
              transition: "flex-basis 0.2s",
            }}
            className="shadow-lg"
          >
            <AIAssistantDialog
              expanded={assistantExpanded}
              chatPanelWidth={100}
              messages={messages}
              onSend={handleSend}
              onExpand={() => setAssistantExpanded(false)}
              onClose={() => {
                setShowAssistant(false);
                setAssistantExpanded(false);
                setEditorWidth(50);      // Reset editor width to 50%
                setChatPanelWidth(50);   // Reset chat panel width to 50%
              }}
            />
          </div>
        </>
      )}
      {/* AI Assistant (floating) */}
      {showAssistant && !assistantExpanded && (
        <div className="fixed bottom-6 right-6 z-50">
          <AIAssistantDialog
            expanded={assistantExpanded}
            chatPanelWidth={chatPanelWidth}
            messages={messages}
            onSend={handleSend}
            onExpand={() => {
              setAssistantExpanded(true);
              setChatPanelWidth(30);   // Assistant: 30%
              setEditorWidth(30);      // Editor: 30%
              // Result panel will be 100 - 30 - 30 = 40%
            }}
            onClose={() => {
              setShowAssistant(false);
              setAssistantExpanded(false);
              setEditorWidth(50);
              setChatPanelWidth(50);
            }}
          />
        </div>
      )}
      {!showAssistant && (
        <AIAssistantButton onClick={() => setShowAssistant(true)} />
      )}
    </div>
  );
};

export default PlaygroundPage;