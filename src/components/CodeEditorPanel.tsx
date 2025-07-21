import MonacoEditor from "@monaco-editor/react";
import { FaCode, FaCheckCircle, FaTimesCircle, FaBug } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface CodeEditorPanelProps {
  code: string;
  onCodeChange: (value: string | undefined) => void;
  onRun: () => void;
  onSubmit: () => void;
  onMaximize: () => void;
  maximized: boolean;
  editorTab: "editor" | "accepted";
  onEditorTabChange: (tab: "editor" | "accepted") => void;
  submissionDetail?: any;
  handleDebug: () => void;
}

const CodeEditorPanel = ({
  code,
  onCodeChange,
  onRun,
  onSubmit,
  onMaximize,
  maximized,
  editorTab,
  onEditorTabChange,
  submissionDetail,
  handleDebug
}: CodeEditorPanelProps) => {
  return (
    <>
      <div className="flex justify-between items-center w-full mb-2">
        <div className="flex items-center gap-2">
          <button
            className={`flex items-center gap-2 px-3 py-1 rounded-t transition ${
              editorTab === "editor"
                ? "bg-white border-b-2 border-indigo-600 font-bold"
                : "bg-gray-100"
            }`}
            onClick={() => {
              onEditorTabChange("editor");
              // Optionally, in parent, setSelectedSubmission(null) when this is clicked
            }}
            style={{ outline: "none" }}
          >
            <FaCode className="inline-block" />
            Code Editor
          </button>
          {submissionDetail && (
            <button
              className={`flex items-center gap-2 px-3 py-1 rounded-t transition ${
                editorTab === "accepted"
                  ? "bg-white border-b-2 border-green-600 font-bold"
                  : "bg-gray-100"
              }`}
              onClick={() => onEditorTabChange("accepted")}
              style={{ outline: "none" }}
            >
              <FaCheckCircle className="text-green-500" />
              Accepted
            </button>
          )}
        </div>
        <div className="flex gap-2">
                    <button
              className="p-2 rounded hover:bg-gray-200 transition"
              onClick={handleDebug}
              title="Debug the code with AI Assistant"
              style={{ display: "flex", alignItems: "center" }}
            >
              <FaBug className="text-xl text-orange-500" />
            </button>
          <button
            className="bg-lamaPurple text-white px-4 py-1 rounded hover:bg-lamaPurpleLight transition"
            onClick={onRun}
          >
            Run
          </button>
          <button
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
            onClick={onSubmit}
          >
            Submit
          </button>
        </div>
      </div>
      {editorTab === "editor" && (
        <div className="flex-1 overflow-y-auto w-full mt-5">
          <MonacoEditor
            height="100%"
            defaultLanguage="python"
            value={code}
            onChange={onCodeChange}
            theme="vs-light"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      )}
      {editorTab === "accepted" && submissionDetail && (
        <div
          className={`p-6 rounded-lg shadow border
            ${
              submissionDetail.status === "Accepted"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }
            overflow-y-auto
            max-h-[60vh]
          `}
          style={{
            // fallback for maxHeight if Tailwind is not used
            maxHeight: "60vh",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            {submissionDetail.status === "Accepted" ? (
              <>
                <FaCheckCircle className="text-green-500 text-xl" />
                <span className="font-bold text-green-700 text-lg">Accepted</span>
              </>
            ) : (
              <>
                <FaTimesCircle className="text-red-500 text-xl" />
                <span className="font-bold text-red-600 text-lg">Wrong Answer</span>
              </>
            )}
          </div>
          <div className="mb-2 text-gray-700">
            <span className="font-semibold">Submitted at:</span>{" "}
            <span className="font-mono">{submissionDetail.submittedAt}</span>
          </div>
          <div className="mb-4 flex gap-4">
            <span className="inline-block bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-xs font-semibold">
              Runtime:{" "}
              <span className="font-mono">
                {submissionDetail.runtime ?? "--"}s
              </span>
            </span>
            <span className="inline-block bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full px-3 py-1 text-xs font-semibold">
              Memory:{" "}
              <span className="font-mono">
                {submissionDetail.memory ?? "--"}MB
              </span>
            </span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-gray-700">Your Code:</span>
            <pre className="bg-gray-900 text-green-200 rounded p-4 text-xs font-mono overflow-x-auto mt-2 border border-gray-700">
              {submissionDetail.code}
            </pre>
          </div>
          {/* AI Feedback block */}
          {submissionDetail.feedback && (
            <div className="mt-6">
              <div className="font-semibold text-indigo-700 mb-2">AI Feedback</div>
              <div
                className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 prose prose-indigo max-w-none"
                style={{
                  whiteSpace: "pre-wrap",
                  marginTop: 4,
                  maxWidth: "100%",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre({ children, ...props }) {
                      return <pre {...props}>{children}</pre>;
                    },
                    code({ node, inline, className, children, ...props }) {
                      const isCodeBlock = className && className.startsWith("language-");
                      if (isCodeBlock) {
                        const match = /language-(\w+)/.exec(className || "");
                        return (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match ? match[1] : undefined}
                            PreTag="div"
                            wrapLongLines={true}
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        );
                      }
                      return (
                        <code
                          {...props}
                          className="variable-inline-highlight"
                        >
                          {children}
                        </code>
                      );
                    },
                    ul({ children, ...props }) {
                      return (
                        <ul
                          {...props}
                          className="pl-6 list-disc mb-2"
                        >
                          {children}
                        </ul>
                      );
                    },
                    li({ children, ...props }) {
                      return (
                        <li
                          {...props}
                          className="mb-1 leading-relaxed"
                        >
                          {children}
                        </li>
                      );
                    },
                  }}
                >
                  {
                    (() => {
                      let text = submissionDetail.feedback
                        .replace(/(\n__SESSION_ID__.*$)/s, "")
                        .replace(/(^|\n)\* (?!\*)(.*)/g, '$1- $2')
                        .replace(/^(__RUN_CODE__)+/, "")
                        .replace(/^(__RUN_CODE_DONE__)+/, "");
                      if (text.includes("```python")) {
                        return text;
                      }
                      let count = 0;
                      text = text.replace(/```/g, () => (++count % 2 === 1 ? "```python" : "```"));
                      return text;
                    })()
                  }
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CodeEditorPanel;