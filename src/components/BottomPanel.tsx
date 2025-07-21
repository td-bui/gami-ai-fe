import { FaRegFileAlt, FaRegListAlt } from "react-icons/fa";

type TestCase = {
  input: string;
  expected: string;
};

interface BottomPanelProps {
  activePanel: "testcases" | "result";
  onPanelChange: (panel: "testcases" | "result") => void;
  onClose: () => void;
  maximized: boolean;
  testcases: TestCase[];
  onTestcaseChange: (idx: number, field: "input" | "expected", value: string) => void;
  onAddTestcase: () => void;
  onRemoveTestcase: (idx: number) => void;
  output: string | null;
  runLoading: boolean;
  runError: string | null;
  className?: string;
}

const BottomPanel = ({
  className = "",
  activePanel,
  onPanelChange,
  onClose,
  maximized,
  testcases,
  onTestcaseChange,
  onAddTestcase,
  onRemoveTestcase,
  output,
  runLoading,
  runError,
}: BottomPanelProps) => {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex">
        <button
          className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium transition border-b-2 ${
            activePanel === "testcases"
              ? "border-lamaPurple text-lamaPurple bg-white"
              : "border-transparent text-gray-500"
          }`}
          onClick={() => onPanelChange("testcases")}
        >
          <FaRegListAlt />
          Testcases
        </button>
        <button
          className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium transition border-b-2 ${
            activePanel === "result"
              ? "border-lamaPurple text-lamaPurple bg-white"
              : "border-transparent text-gray-500"
          }`}
          onClick={() => onPanelChange("result")}
        >
          <FaRegFileAlt />
          Test Result
        </button>
        <button
          className="px-2 py-1 text-gray-400 hover:text-gray-700 ml-2"
          onClick={onClose}
          title="Close"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activePanel === "testcases" ? (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold flex items-center gap-2">
                <FaRegListAlt className="inline-block" />
                Testcases
              </span>
              <div className="flex items-center">
                <button
                  className="px-2 py-1 bg-lamaPurple text-white rounded text-xs hover:bg-lamaPurpleLight"
                  onClick={onAddTestcase}
                  type="button"
                >
                  + Add
                </button>
              </div>
            </div>
            <ul className="space-y-2">
              {testcases.map((tc, idx) => (
                <li key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    className="border border-gray-300 rounded px-2 py-1 text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-lamaPurple transition"
                    value={tc.input}
                    onChange={(e) => onTestcaseChange(idx, "input", e.target.value)}
                    placeholder="Input"
                  />
                  <input
                    className="border border-gray-300 rounded px-2 py-1 text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-lamaPurple transition"
                    value={tc.expected}
                    onChange={(e) => onTestcaseChange(idx, "expected", e.target.value)}
                    placeholder="Expected"
                  />
                  <button
                    className="ml-0 sm:ml-1 text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded transition"
                    onClick={() => onRemoveTestcase(idx)}
                    type="button"
                    title="Remove"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold flex items-center gap-2">
                <FaRegFileAlt className="inline-block" />
                Test Result
              </span>
            </div>
            <div className="bg-gray-100 rounded p-2 text-sm font-mono mt-2 min-h-[80px] whitespace-pre-wrap">
              {runLoading ? (
                <span className="text-indigo-600">Running code...</span>
              ) : runError ? (
                <span className="text-red-600">{runError}</span>
              ) : output ? (
                <div className="space-y-3">
                  {output
                    .split(/(?=Testcase \d+:)/g)
                    .filter(Boolean)
                    .map((block, idx) => {
                      const passed = block.includes("✅ Passed");
                      return (
                        <div
                          key={idx}
                          className={`rounded border p-2 ${
                            passed
                              ? "border-green-300 bg-green-50"
                              : "border-red-300 bg-red-50"
                          }`}
                        >
                          {block.split("\n").map((line, i) => (
                            <div
                              key={i}
                              className={
                                line.includes("✅ Passed")
                                  ? "text-green-700 font-semibold"
                                  : line.includes("❌ Failed")
                                  ? "text-red-700 font-semibold"
                                  : line.startsWith("User Error")
                                  ? "text-orange-700"
                                  : line.startsWith("Solution Error")
                                  ? "text-yellow-700"
                                  : "text-gray-800"
                              }
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <span className="text-gray-400">No result yet. Click Run to test your code.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomPanel;