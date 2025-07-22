import { useEffect } from "react";
import { FaRegFileAlt, FaRegListAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im"; // For spinner
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface ProblemType {
  title: string;
  description: string;
  examples: string;
  constraints?: string;
  difficulty?: string;
  tags?: string[];
  numberOfAccepted?: number;
  numberOfAttempts?: number;
  isHtml?: boolean; // <-- Add this line
}

interface SubmissionType {
  id: number; // <-- Add this line (or string, if your IDs are strings)
  code: string;
  result: string;
  time: string;
  status?: string;
  submittedAt?: string;
  language?: string;
  runtime?: number;
  memory?: number;
}

interface SubmissionResultType {
  submission: any;
  totalTestCases: number;
  passedTestCases: number;
  failedTestCase: any;
}

interface ProblemDescriptionPanelProps {
  problem: ProblemType;
  submissions: SubmissionType[];
  activeTab: "description" | "submissions" | "accepted";
  onTabChange: (tab: "description" | "submissions" | "accepted") => void;
  submissionResult: SubmissionResultType | null;
  onSubmissionClick?: (submissionId: number) => void;
  showAcceptedTab: boolean;
}

const difficultyColor = (difficulty?: string) => {
  switch ((difficulty || "").toLowerCase()) {
    case "easy":
      return "bg-green-100 text-green-700 border-green-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "hard":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const ProblemDescriptionPanel = ({
  problem,
  submissions,
  activeTab,
  onTabChange,
  submissionResult,
  submitLoading,
  user,
  onSubmissionClick,
  showAcceptedTab
}: ProblemDescriptionPanelProps & { submitLoading?: boolean; user?: { name: string }, showAcceptedTab?: boolean }) => {
  // Parse plain text examples into blocks
  const parsedExamples = (() => {
    if (!problem.examples) return [];
    return problem.examples
      .split(/\n\s*\n/)
      .map((block) => {
        const inputMatch = block.match(/Input:\s*([\s\S]*?)\nOutput:/);
        const outputMatch = block.match(/Output:\s*([\s\S]*)/);
        return {
          input: inputMatch ? inputMatch[1].trim() : "",
          output: outputMatch ? outputMatch[1].trim() : "",
        };
      })
      .filter((ex) => ex.input || ex.output);
  })();

  // Helper for formatting date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get runtime and memory from submissionResult
  const getRuntime = () => {
    if (!submissionResult?.submission) return null;
    return submissionResult.submission.runtime
      ? `${submissionResult.submission.runtime.toFixed(3)}s`
      : null;
  };
  const getMemory = () => {
    if (!submissionResult?.submission) return null;
    return submissionResult.submission.memory
      ? `${submissionResult.submission.memory.toFixed(2)}MB`
      : null;
  };

  return (
    <>
      <div className="flex gap-4 mb-4 border-b">
        <button
          className={`py-2 px-4 font-semibold flex items-center gap-2 ${
            activeTab === "description"
              ? "border-b-2 border-indigo-600 text-indigo-700"
              : "text-gray-500"
          }`}
          onClick={() => onTabChange("description")}
        >
          <FaRegFileAlt className="inline-block" />
          Description
        </button>
        <button
          className={`py-2 px-4 font-semibold flex items-center gap-2 ${
            activeTab === "submissions"
              ? "border-b-2 border-indigo-600 text-indigo-700"
              : "text-gray-500"
          }`}
          onClick={() => onTabChange("submissions")}
        >
          <FaRegListAlt className="inline-block" />
          Submissions
        </button>
        {activeTab === "accepted" && (
          <span className="relative">
            <button
              className={`py-2 px-4 font-semibold flex items-center gap-2 ${
                activeTab === "accepted"
                  ? "border-b-2 border-green-600 text-green-700"
                  : "text-gray-500"
              }`}
              onClick={() => onTabChange("accepted")}
            >
              <FaCheckCircle className="inline-block" />
              Accepted
              {activeTab === "accepted" && (
                <FaTimesCircle
                  className="ml-2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    onTabChange("description");
                  }}
                  title="Close"
                  size={16}
                />
              )}
            </button>
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {activeTab === "accepted" && (
          !submissionResult ? (
            <div className="flex flex-col items-center justify-center h-40">
              <ImSpinner2 className="animate-spin text-3xl text-indigo-500 mb-2" />
              <span className="text-indigo-600 font-medium">Loading result...</span>
            </div>
          ) : (
            <div
              className={`p-6 rounded-lg shadow border mb-4
                ${
                  submissionResult.passedTestCases === submissionResult.totalTestCases
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }
              `}
            >
              {/* Title */}
              <div className="flex items-center gap-2 mb-2">
                {submissionResult.passedTestCases === submissionResult.totalTestCases ? (
                  <>
                    <FaCheckCircle className="text-green-500" />
                    <span className="font-bold text-green-700 text-lg">Accepted</span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-red-500" />
                    <span className="font-bold text-red-600 text-lg">Wrong Answer</span>
                  </>
                )}
              </div>
              <div className="mb-2 text-gray-700">
                {user?.name || "User"} submitted at{" "}
                <span className="font-mono">{submissionResult.submission?.submittedAt
                  ? formatDate(submissionResult.submission.submittedAt)
                  : ""}</span>
              </div>
              <div className="mb-2 text-gray-700">
                Passed {submissionResult.passedTestCases} / {submissionResult.totalTestCases} test cases
              </div>
              <div className="mb-4 flex gap-4">
                <span className="inline-block bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-xs font-semibold">
                  Runtime: <span className="font-mono">{getRuntime() || "--"}</span>
                </span>
                <span className="inline-block bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full px-3 py-1 text-xs font-semibold">
                  Memory: <span className="font-mono">{getMemory() || "--"}</span>
                </span>
              </div>
              <div className="mb-2">
                <span className="font-semibold text-gray-700">Your Code:</span>
                <pre className="bg-gray-900 text-green-200 rounded p-4 text-xs font-mono overflow-x-auto mt-2 border border-gray-700">
                  {submissionResult.submission?.code}
                </pre>
              </div>
              {/* Only show failed testcase block if not accepted */}
              {submissionResult.passedTestCases !== submissionResult.totalTestCases &&
                submissionResult.failedTestCase && (
                  <div className="mt-4">
                    <div className="font-semibold text-red-600 mb-1">
                      First Failed Testcase:
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                      <div>
                        <span className="font-semibold">Input:</span>{" "}
                        {submissionResult.failedTestCase.input}
                      </div>
                      <div>
                        <span className="font-semibold">Expected:</span>{" "}
                        {submissionResult.failedTestCase.solutionOutput}
                      </div>
                      <div>
                        <span className="font-semibold">Your Output:</span>{" "}
                        {submissionResult.failedTestCase.userOutput}
                      </div>
                      {submissionResult.failedTestCase.userError && (
                        <div className="text-red-500">
                          <span className="font-semibold">Error:</span>{" "}
                          {submissionResult.failedTestCase.userError}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              {/* AI Feedback block */}
              {submissionResult.submission?.feedback && (
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
                        code({ node, className, children, ...props }) {
                          const isCodeBlock = className && className.startsWith("language-");
                          if (isCodeBlock) {
                            const match = /language-(\w+)/.exec(className || "");
                            return (
                              <SyntaxHighlighter
                                style={oneDark as any}
                                language={match ? match[1] : undefined}
                                PreTag="div"
                                wrapLongLines={true}
          
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
                          let text = submissionResult.submission.feedback
                            .replace(/(\n__SESSION_ID__.*$)/, "")
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
          )
        )}
        {activeTab === "description" ? (
          <>
            <h1 className="text-2xl font-bold mb-3 text-indigo-800">
              {problem.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {problem.difficulty && (
                <span
                  className={`inline-block border rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${difficultyColor(
                    problem.difficulty
                  )}`}
                >
                  {problem.difficulty}
                </span>
              )}
              {problem.tags && problem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Description rendering logic */}
            {problem.isHtml ? (
              // HTML style (old logic)
              <div
                className="prose prose-indigo max-w-none mb-6 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-pink-700 [&_pre]:bg-gray-100 [&_pre]:rounded"
                dangerouslySetInnerHTML={{ __html: problem.description || "" }}
              />
            ) : (
              // Markdown style (new logic)
              <div className="prose prose-indigo max-w-none mb-6 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-pink-700 [&_pre]:bg-gray-100 [&_pre]:rounded">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-indigo-800 mt-6 mb-3" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-indigo-700 mt-6 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-indigo-600 mt-5 mb-2" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-base font-semibold text-indigo-500 mt-4 mb-2" {...props} />,
                    code({ node, className, children, ...props }) {
                      const isCodeBlock = className && className.startsWith("language-");
                      if (isCodeBlock) {
                        const match = /language-(\w+)/.exec(className || "");
                        return (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match ? match[1] : undefined}
                            PreTag="div"
                            wrapLongLines={true}
                            customStyle={{
                              borderRadius: 8,
                              padding: 16,
                              background: "#f8fafc",
                              fontSize: 14,
                              margin: "12px 0"
                            }}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        );
                      }
                      return (
                        <code
                          {...props}
                          className="bg-gray-100 px-1 rounded text-pink-700 font-mono"
                          style={{ fontSize: 13 }}
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
                    hr: ({...props}) => <hr className="my-6 border-indigo-200" {...props} />,
                    p: ({...props}) => <p className="mb-3" {...props} />,
                  }}
                >
                  {problem.description || ""}
                </ReactMarkdown>
              </div>
            )}
            {/* Only show examples and constraints if isHtml is true */}
            {problem.isHtml && parsedExamples.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-indigo-700">Examples</h3>
                {parsedExamples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="mb-4 bg-gray-50 border border-gray-200 p-4 rounded-lg"
                  >
                    <div className="mb-1">
                      <span className="font-semibold text-gray-700">Input:</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 rounded font-mono text-sm text-gray-800">
                        {ex.input}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="font-semibold text-gray-700">Output:</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 rounded font-mono text-sm text-gray-800">
                        {ex.output}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {problem.isHtml && problem.constraints && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2 text-indigo-700">Constraints</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm font-mono text-gray-800 whitespace-pre-line leading-relaxed">
                  {problem.constraints}
                </div>
              </div>
            )}
            {/* Add this block for stats */}
            {typeof problem.numberOfAccepted === "number" &&
              typeof problem.numberOfAttempts === "number" && (
                <div className="flex items-center gap-8 bg-white border border-indigo-200 rounded-lg px-6 py-3 mb-4 shadow-sm w-fit">
                  <div className="flex items-end gap-2">
                    <span className="text-xs font-semibold text-gray-500 mr-2">
                      Accepted
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {problem.numberOfAccepted.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-sm font-medium">
                      / {problem.numberOfAttempts.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-8 border-l border-gray-200 mx-4"></div>
                  <div className="flex items-end gap-2">
                    <span className="text-xs font-semibold text-gray-500">
                      Acceptance Rate
                    </span>
                    <span className="text-lg font-bold text-indigo-600">
                      {problem.numberOfAttempts > 0
                        ? `${(
                            (problem.numberOfAccepted /
                              problem.numberOfAttempts) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              )}
          </>
        ) : activeTab === "submissions" ? (
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3 text-indigo-700">
              <FaRegFileAlt className="inline-block" />
              Submission History
            </h3>
            {submissions.length === 0 ? (
              <div className="text-gray-400 text-sm">No submissions yet.</div>
            ) : (
              <ul className="space-y-3">
                {submissions.map((sub, idx) => (
                  <li
                    key={sub.id}
                    className="p-3 rounded-lg border border-gray-200 bg-gray-50 shadow-sm cursor-pointer hover:bg-indigo-50"
                    onClick={() => onSubmissionClick && onSubmissionClick(sub.id)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`font-semibold ${
                          sub.status === "Accepted"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {sub.status}
                      </span>
                      <span className="text-xs text-gray-400">{sub.submittedAt}</span>
                    </div>
                    <div className="mb-1">
                      <span className="text-gray-600 text-xs">Language:</span> {sub.language}
                      <span className="ml-4 text-gray-600 text-xs">Runtime:</span> {sub.runtime ?? "--"}s
                      <span className="ml-4 text-gray-600 text-xs">Memory:</span> {sub.memory ?? "--"}MB
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ): null}
      </div>
    </>
  );
};

export default ProblemDescriptionPanel;