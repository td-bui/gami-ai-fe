"use client";

import { useState, useRef, useEffect } from "react";
import NextProblemModal from "@/components/NextProblemModal";
import { useSearchParams, notFound, useRouter } from "next/navigation";
import { FaRegFileAlt, FaRegListAlt } from "react-icons/fa";
import AIAssistantButton from "@/components/AIAssistantButton";
import VSCodeVerticalDivider from "@/components/VSCodeVerticalDivider";
import AIAssistantDialog from "@/components/AIAssistantDialog";
import { authFetch } from "@/utils/authFetch";
import ProblemDescriptionPanel from "@/components/ProblemDescriptionPanel";
import CodeEditorPanel from "@/components/CodeEditorPanel";
import BottomPanel from "@/components/BottomPanel";
import toast from "react-hot-toast"; // Import toast

// Define a type for the problem data
interface ProblemType {
  id: string;
  title: string;
  description: string;
  examples: string;
  starterCode: string;
  testCases: { input: string; expectedOutput: string }[];
}

export default function ProblemDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemId = searchParams.get('problemId');
  const lessonId = searchParams.get('lessonId');

  // Redirect to 404 if both are null
  if (!problemId && !lessonId) {
    notFound();
  }

  const [problem, setProblem] = useState<ProblemType | null>(null);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "submissions" | "accepted">("description");
  const [dividerActive, setDividerActive] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50); // percent
  const [testcases, setTestcases] = useState<{ input: string; expected: string }[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [editorHeight, setEditorHeight] = useState(70); // percent
  const [maximized, setMaximized] = useState<"editor" | "testcases" | "result" | null>(null);
  const [bottomPanel, setBottomPanel] = useState<null | "testcases" | "result">(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const aiBaseUrl = process.env.NEXT_PUBLIC_AI_BASE_URL;

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantExpanded, setAssistantExpanded] = useState(false);
  type Message = { from: "user" | "ai"; text: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [editorPanelWidth, setEditorPanelWidth] = useState(40);
  const [chatPanelWidth, setChatPanelWidth] = useState(30);
  const [dragChatDivider, setDragChatDivider] = useState(false);
  const [showAcceptedTab, setShowAcceptedTab] = useState(false);
  const [nextModalAction, setNextModalAction] = useState<"accepted" | "increase_difficulty" | "decrease_difficulty" | null>(null);

  

  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId && !lessonId) {
        setLoading(false);
        router.replace("/not-found");
        return;
      }

      setLoading(true);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const url = problemId
        ? `${apiBaseUrl}/api/problems/${problemId}`
        : `${apiBaseUrl}/api/problems/by-lesson/${lessonId}`;

      try {
        const res = await authFetch(url);
        if (!res.ok) throw new Error("Failed to fetch problem");
        const data = await res.json();
        if (!data) {
          router.replace("/not-found");
          return;
        }
        setProblem(data);
        setCode(data.starterCode || "");
        setTestcases(data.testCases?.map((tc: any) => ({ input: tc.input, expected: tc.expectedOutput })) || []);
      } catch (error) {
        setProblem(null);
        router.replace("/not-found");
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId, lessonId, router]);

  // Fetch submissions for the current problem/user
  const fetchSubmissions = async () => {
    if (!problem) return;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await authFetch(`${apiBaseUrl}/api/submissions?problemId=${problem.id}`);
    if (res.ok) {
      const data = await res.json();
      setSubmissions(data);
    }
  };

  // Call fetchSubmissions after loading the problem or after a new submission
  useEffect(() => {
    if (problem) fetchSubmissions();
  }, [problem]);

  // Track when user enters the page
  const [startTime, setStartTime] = useState<number>(() => Date.now());

  // When user runs code
  const handleRun = async () => {
    if (!problem) return;
    setRunLoading(true);
    setRunError(null);
    setOutput(null);
    setBottomPanel("result");

    const start = startTime;

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const runRes = await authFetch(
        `${apiBaseUrl}/api/problems/${problem.id}/run-user-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userCode: code,
            testCases: testcases.map((tc, idx) => ({
              id: idx + 1,
              input: tc.input
            }))
          }),
        }
      );
      if (!runRes.ok) throw new Error("Failed to start code execution");
      const { job_id } = await runRes.json();

      // Poll for result, passing only timeTaken
      let pollCount = 0;
      let resultData = null;
      let action = null; // <-- define action here

      while (pollCount < 20) {
        await new Promise(res => setTimeout(res, 500));
        const endTime = Date.now();
        const timeTaken = (endTime - start) / 1000; // seconds
        const resultRes = await authFetch(
          `${apiBaseUrl}/api/problems/result-problem/${job_id}?timeTaken=${timeTaken}`,
          {
            headers: {
              "problem-id": problem.id
            }
          }
        );
        if (!resultRes.ok) throw new Error("Failed to fetch execution result");
        const data = await resultRes.json();
        const result = data.result;
        action = data.action; // <-- assign action here
        if (result && (result.status === "finished" || result.status === "failed")) {
          resultData = result;
          break;
        }
        pollCount++;
      }

      if (!resultData) throw new Error("Timed out waiting for result");

      // Format output for the bottom panel
      if (resultData.status === "finished") {
        setOutput(
          resultData.results
            .map(
              (r: any) =>
                `Testcase ${r.id}: ${r.passed ? "✅ Passed" : "❌ Failed"}\n` +
                (r.userError ? `User Error: ${r.userError}\n` : "") +
                (r.solutionError ? `Solution Error: ${r.solutionError}\n` : "") +
                `Input: ${r.input}\nExpected: ${r.solutionOutput}\nYour Output: ${r.userOutput}\n`
            )
            .join("\n")
        );
      } else {
        setOutput(`Error: ${resultData.error || "Unknown error"}`);
      }
      console.log("Action taken:", action); // Log the action for debugging
      if (action === "give_hint") {
        console.log("Showing hint popup");
        setShowHintPopup(true);
        setTimeout(() => setShowHintPopup(false), 4000);
      }
      if (action === "show_motivation") {
        showMotivation();
      }
      if (action === "increase_difficulty" || action === "decrease_difficulty") {
        setNextModalAction(action);
        setShowNextModal(true);
      }
    } catch (err: any) {
      setRunError(err.message || "Run failed");
      setOutput(null);
    } finally {
      setRunLoading(false);
      setStartTime(Date.now()); // Reset start time for next run/submit
    }
  };


  const handleSubmit = async () => {
    if (!problem) return;
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmissionResult(null);
    setActiveTab("accepted");

    const start = startTime;

    try {
      const userId = localStorage.getItem("userId"); // Get userId from localStorage
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const submitRes = await authFetch(
        `${apiBaseUrl}/api/problems/${problem.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userCode: code,
            userId: userId ? parseInt(userId, 10) : null, // Add userId to payload
          }),
        }
      );
      if (!submitRes.ok) throw new Error("Failed to submit code");
      const { job_id } = await submitRes.json();

      // Poll for result, passing only timeTaken
      let pollCount = 0;
      let resultData = null;
      while (pollCount < 20) {
        await new Promise(res => setTimeout(res, 500));
        const endTime = Date.now();
        const timeTaken = (endTime - start) / 1000; // seconds

        // Build headers, include lesson-id if present
        const headers: Record<string, any> = {
          "problem-id": problem.id
        };
        if (lessonId) {
          headers["lesson-id"] = lessonId;
        }

        const resultRes = await authFetch(
          `${apiBaseUrl}/api/problems/result-submit/${job_id}?timeTaken=${timeTaken}`,
          {
            headers
          }
        );
        if (!resultRes.ok) throw new Error("Failed to fetch submission result");
        const data = await resultRes.json();
        const result = data.result; // <-- get the actual result object
        if (result && result.submission) {
          resultData = result;
          break;
        }
        pollCount++;
      }

      if (!resultData) throw new Error("Timed out waiting for submission result");
      setSubmissionResult(resultData);

      // Show toast if XP was gained
      if (resultData.xpGained && resultData.xpGained > 0) {
        toast.success(`You gained ${resultData.xpGained} XP! ✨`);
      }

      setShowAcceptedTab(true);
      setActiveTab("accepted");
      fetchSubmissions(); // refresh list after submit
    } catch (err: any) {
      setSubmitError(err.message || "Submit failed");
      setSubmissionResult(null);
    } finally {
      setSubmitLoading(false);
      setStartTime(Date.now()); // Reset start time for next run/submit
    }
  };

  interface TabChangeHandler {
    (tab: "description" | "submissions" | "accepted"): void;
  }

  const handleTabChange: TabChangeHandler = (tab) => {
    setActiveTab(tab);
    if (tab !== "accepted") setShowAcceptedTab(false);
  };

  const handleDividerClick = () => {
    setDividerActive((prev) => !prev);
    document.body.style.cursor = dividerActive ? "" : "col-resize";
  };
  // Add the debug handler
  const handleDebug = () => {
    // Simulate entering "Debug the code" as user input
    handleAssistantSend("Debug the code");
    // Optionally, open the assistant dialog if not already open
    setShowAssistant(true);
    setAssistantExpanded(true);
    // Optionally, focus the input (if you have a ref to it)
    // assistantInputRef.current?.focus();
  };

  useEffect(() => {
    if (!dividerActive) {
      document.body.style.cursor = "";
      return;
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (dividerActive && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        let newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        newLeftWidth = Math.max(20, Math.min(80, newLeftWidth));
        setLeftWidth(newLeftWidth);
      }
    };
    const handleMouseUp = () => {
      setDividerActive(false);
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [dividerActive]);

  const [verticalDividerActive, setVerticalDividerActive] = useState(false);

  useEffect(() => {
    if (!verticalDividerActive) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (verticalDividerActive && rightPanelRef.current) {
        const panelRect = rightPanelRef.current.getBoundingClientRect();
        let newEditorHeight = ((e.clientY - panelRect.top) / panelRect.height) * 100;
        newEditorHeight = Math.max(20, Math.min(80, newEditorHeight));
        setEditorHeight(newEditorHeight);
      }
    };
    const handleMouseUp = () => setVerticalDividerActive(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [verticalDividerActive]);

  const handleMaximize = (part: "editor" | "testcases" | "result") => {
    setMaximized((prev) => (prev === part ? null : part));
  };

  const handleTestcaseChange = (idx: number, field: "input" | "expected", value: string) => {
    setTestcases(prev => prev.map((tc, i) => (i === idx ? { ...tc, [field]: value } : tc)));
  };

  const handleAddTestcase = () => {
    setTestcases(prev => [...prev, { input: "", expected: "" }]);
  };

  const handleRemoveTestcase = (idx: number) => {
    setTestcases(prev => prev.filter((_, i) => i !== idx));
  };


  useEffect(() => {
    if (!dragChatDivider) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        const leftPx = assistantExpanded ? (containerRect.width * 0.3) : (containerRect.width * leftWidth / 100);
        let newEditorWidth = ((x - leftPx) / containerRect.width) * 100;
        newEditorWidth = Math.max(20, Math.min(70, newEditorWidth));
        setEditorPanelWidth(newEditorWidth);
        setChatPanelWidth(100 - 30 - newEditorWidth);
      }
    };
    const handleMouseUp = () => setDragChatDivider(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragChatDivider, assistantExpanded, leftWidth]);

  const handleSubmissionClick = async (submissionId: number) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await authFetch(`${apiBaseUrl}/api/submissions/${submissionId}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedSubmission(data);
      setEditorTab("accepted"); // Only switch the editor panel tab
    }
  };

  const [editorTab, setEditorTab] = useState<"editor" | "accepted">("editor");

  const handleEditorTabChange = (tab: "editor" | "accepted") => {
    setEditorTab(tab);
    if (tab === "editor") setSelectedSubmission(null);
  };

  function buildAssistantExtra() {
    return {
      problem_id: problem?.id,
      problem_title: problem?.title,
      problem_description: problem?.description,
      user_code: code,
      running_result: output,
      testcase: testcases,
      last_agent: 'hint'
      // You can add session_id and last_agent if needed
    };
  }

  const handleAssistantSend = async (userInput: string) => {
    setMessages(prev => [...prev, { from: "user", text: userInput }]);
    const response = await authFetch(`${aiBaseUrl}/api/ai/orchestrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput,
        extra: buildAssistantExtra(),
      }),
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

  const [showHintPopup, setShowHintPopup] = useState(false);
  const [motivationMsg, setMotivationMsg] = useState<string | null>(null);

  // Example motivational messages
  const motivationMessages = [
    "Keep going, you're doing great!",
    "Don't give up, every attempt is progress!",
    "Remember, every coder was once a beginner.",
    "You're closer than you think!"
  ];

  // Utility to show a random motivation message
  function showMotivation() {
    const msg = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
    setMotivationMsg(msg);
    setTimeout(() => setMotivationMsg(null), 4000);
  }

  // Modal state
  const [showNextModal, setShowNextModal] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);

  // Handler for modal accept
  const handleAcceptNext = async () => {
    setLoadingNext(true);

    try {
      const user_id = typeof window !== "undefined" ? localStorage.getItem("userId") : "";
      const user_level = (typeof window !== "undefined" ? localStorage.getItem("level") : "") || "beginner";
      let userInput = "Give the next problem";
      if (nextModalAction === "increase_difficulty") {
        userInput = "Give me a harder problem";
      } else if (nextModalAction === "decrease_difficulty") {
        userInput = "Give me an easier problem";
      }
      const res = await authFetch(`${aiBaseUrl}/api/ai/orchestrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
        body: JSON.stringify({
          userInput,
          extra: {
            problem_id: problem?.id,
            user_id,
            user_level,
          },
        }),
      });
      const data = await res.json();
      if (data && data.id && data.type === "problem") {
        router.push(`/problem-detail/?problemId=${data.id}`);
      }
    } catch (e) {
      // handle error
    } finally {
      setLoadingNext(false);
      setShowNextModal(false);
      setNextModalAction(null);
    }
  };

  // Show modal when accepted
  useEffect(() => {
    if (
      activeTab === "accepted" &&
      submissionResult &&
      submissionResult.passedTestCases === submissionResult.totalTestCases
    ) {
      setTimeout(() => {
        setNextModalAction("accepted");
        setShowNextModal(true);
      }, 800);
    } else {
      setShowNextModal(false);
      setNextModalAction(null);
    }
  }, [activeTab, submissionResult]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[400px]">
        <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      </div>
    );
  }

  if (!problem) {
    return <div className="flex items-center justify-center h-full">Problem not found.</div>;
  }

  let modalText = "Go to the next problem?";
  if (nextModalAction === "increase_difficulty") {
    modalText = "Great job! Ready for a harder problem?";
  } else if (nextModalAction === "decrease_difficulty") {
    modalText = "Need something easier? Go to an easier problem?";
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 p-4 flex flex-row gap-0 h-full min-h-[500px] bg-gray-50"
      style={{ overflow: "hidden" }}
    >
      <div
        className="bg-white rounded-md shadow flex flex-col h-full"
        style={{
          width: assistantExpanded ? "30%" : `calc(${leftWidth}% - 4px)`,
          minWidth: 200,
          maxWidth: assistantExpanded ? undefined : "80%",
          zIndex: maximized && maximized !== "editor" ? 0 : 1,
          display: maximized && maximized !== "editor" ? "none" : undefined,
          transition: "width 0.2s"
        }}
      >
        <ProblemDescriptionPanel
          problem={problem}
          submissions={submissions}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          submissionResult={selectedSubmission || submissionResult}
          submitLoading={submitLoading}
          onSubmissionClick={handleSubmissionClick}
          showAcceptedTab={showAcceptedTab}
          // Optionally pass setShowNextModal if you want to close modal from inside
        />
      </div>
      <div
        className={`w-2 cursor-col-resize bg-gray-200 hover:bg-gray-400 transition flex items-center justify-center select-none`}
        onMouseDown={dividerActive ? undefined : handleDividerClick}
        onClick={dividerActive ? handleDividerClick : undefined}
        style={{
          zIndex: 10,
          background: dividerActive ? "#a78bfa" : undefined,
          transition: "background 0.2s",
        }}
        title={dividerActive ? "Click again to stop resizing" : "Click and move to resize"}
      >
        <span className="w-1 h-8 bg-gray-400 rounded-full block" />
      </div>
      <div
        ref={rightPanelRef}
        className="bg-white rounded-md shadow flex flex-col h-full relative"
        style={{
          width: assistantExpanded ? `${editorPanelWidth}%` : `calc(${100 - leftWidth}% - 4px)`,
          minWidth: 200,
          maxWidth: assistantExpanded ? undefined : "80%",
          zIndex: maximized ? 2 : 1,
          display: maximized && maximized === "editor" ? "flex" : undefined,
          transition: "width 0.2s"
        }}
      >
        <div
          className="border-b flex flex-col p-4"
          style={{
            minHeight: 120,
            flex: bottomPanel === null ? 1 : `0 0 ${editorHeight}%`,
            display: maximized && maximized !== "editor" ? "none" : "flex",
            overflow: "hidden",
            transition: "flex-basis 0.2s",
          }}
        >
          <CodeEditorPanel
            code={selectedSubmission ? selectedSubmission.code : code}
            onCodeChange={value => setCode(value ?? "")}
            onRun={handleRun}
            onSubmit={handleSubmit}
            // readOnly={!!selectedSubmission}
            submissionDetail={selectedSubmission}
            maximized={maximized === "editor"}
            onMaximize={() => handleMaximize("editor")}
            editorTab={editorTab}
            onEditorTabChange={handleEditorTabChange}
            handleDebug={handleDebug}
          />
        </div>
        {bottomPanel !== null && (
          <div
            className="w-full h-2 cursor-row-resize bg-gray-200 hover:bg-gray-400 transition flex items-center justify-center select-none"
            onMouseDown={() => setVerticalDividerActive(true)}
            style={{ zIndex: 10 }}
            title="Drag to resize"
          >
            <span className="h-1 w-8 bg-gray-400 rounded-full block" />
          </div>
        )}
        {bottomPanel === null ? (
          <div className="flex border-t bg-gray-50">
            <button
              className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium transition hover:bg-gray-100"
              onClick={() => setBottomPanel("testcases")}
            >
              <FaRegListAlt />
              Testcases
            </button>
            <button
              className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium transition hover:bg-gray-100"
              onClick={() => setBottomPanel("result")}
            >
              <FaRegFileAlt />
              Test Result
            </button>
          </div>
        ) : (
          <div
            className="flex border-t bg-gray-50"
            style={{
              flex: `0 0 ${100 - editorHeight}%`,
              minHeight: 0,
              maxHeight: "100%",
              flexDirection: "column",
            }}
          >
            <BottomPanel
              className="flex-1 flex flex-col h-full"
              activePanel={bottomPanel}
              onPanelChange={setBottomPanel}
              onClose={() => setBottomPanel(null)}
              testcases={testcases}
              onTestcaseChange={handleTestcaseChange}
              onAddTestcase={handleAddTestcase}
              onRemoveTestcase={handleRemoveTestcase}
              output={output}
              runLoading={runLoading}
              runError={runError}
              maximized={false}
            />
          </div>
        )}
      </div>
      {assistantExpanded && showAssistant && (
        <VSCodeVerticalDivider onMouseDown={() => setDragChatDivider(true)} />
      )}
      {showAssistant && (
        <AIAssistantDialog
          expanded={assistantExpanded}
          chatPanelWidth={chatPanelWidth}
          messages={messages}
          onSend={handleAssistantSend}
          onExpand={() => setAssistantExpanded(prev => !prev)}
          onClose={() => {
            setShowAssistant(false);
            setAssistantExpanded(false);
            setEditorPanelWidth(40);
            setChatPanelWidth(30);
          }}
        />
      )}
      {!showAssistant && (
        <AIAssistantButton
          onClick={() => setShowAssistant(true)}
          showHintPopup={showHintPopup}
          hintMessage="Stuck? Open AI assistant to get hint."
        />
      )}
      {/* Motivation Toast */}
      {motivationMsg && (
        <div
          className="fixed top-8 right-8 flex items-center gap-4 px-6 py-4 rounded-xl shadow-lg z-50 animate-fade-in"
          style={{
            background: "linear-gradient(90deg, #9ECAD6 0%, #6ee7b7 100%)",
            border: "1.5px solid #22c55e",
            minWidth: 320,
            maxWidth: 400,
            fontWeight: 500,
            fontSize: "1.1rem",
            color: "#9929EA",
            boxShadow: "0 8px 32px rgba(34,197,94,0.15)",
          }}
        >
          <img
            src="/ai-assistant.png"
            alt="AI Assistant"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "2px solid #22c55e",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(34,197,94,0.10)",
              flexShrink: 0,
            }}
          />
          <span style={{ lineHeight: 1.5 }}>{motivationMsg}</span>
        </div>
      )}
      {/* Next Problem Modal */}
      {showNextModal && (
        <NextProblemModal
          open={showNextModal}
          onCancel={() => {
            setShowNextModal(false);
            setNextModalAction(null);
          }}
          onAccept={handleAcceptNext}
          loading={loadingNext}
          text={modalText}
        />
      )}
    </div>
  );
}