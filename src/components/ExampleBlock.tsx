"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { prism } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FiInfo } from "react-icons/fi";

const ExampleBlock = ({
  ex,
}: {
  ex: {
    id: string;
    code: string;
    output: string;
    description: string;
  };
}) => {
  const [showDesc, setShowDesc] = useState(false);
  const router = useRouter();

  const handleTryIt = () => {
    router.push(`/playground?exampleId=${encodeURIComponent(ex.id)}`);
  };

  return (
    <div className="example-block mb-4 border rounded bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <button
            className="text-gray-500 hover:text-blue-600 transition"
            onClick={() => setShowDesc((v) => !v)}
            aria-label="Show description"
            type="button"
          >
            <FiInfo size={20} />
          </button>
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
          onClick={handleTryIt}
        >
          Try it yourself
        </button>
      </div>
      {showDesc && (
        <div className="text-gray-600 mt-2 transition-all duration-200">
          {ex.description}
        </div>
      )}
      <div id={`code-${ex.id}`}>
        <SyntaxHighlighter language="python" style={prism}>
          {ex.code}
        </SyntaxHighlighter>
      </div>
      <div className="text-green-700 font-mono mb-1">Output: {ex.output}</div>
    </div>
  );
};

export default ExampleBlock;