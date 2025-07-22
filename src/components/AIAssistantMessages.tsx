import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import oneDark from 'react-syntax-highlighter/dist/cjs/styles/prism/one-dark';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { CSSProperties } from "react";

type Message = { from: "user" | "ai"; text: string };
type SuggestionLink = { type: string; id: number; title?: string } | null;

export default function AIAssistantMessages({
  messages,
  suggestionLink,
}: {
  messages: Message[];
  suggestionLink?: SuggestionLink;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    // Check for running code state
    const lastAiMsg = [...messages].reverse().find(m => m.from === "ai");
    if (lastAiMsg?.text.trim() === "__RUN_CODE__") {
      setIsRunningCode(true);
    }
    if (messages.some(m => m.from === "ai" && m.text.trim() === "__RUN_CODE_DONE__")) {
      setIsRunningCode(false);
    }
  }, [messages]);

  const isEmpty = !messages || messages.length === 0;

  return (
    <div
      className="space-y-4 w-full"
      style={{
        overflowY: "auto",
        maxHeight: "100%",
        maxWidth: "100%",
      }}
    >
      {/* Inline code custom style */}
      <style>
        {`
          code.variable-inline-highlight {
            color: #2d7ff9 !important;
            font-weight: bold;
            background: rgba(45,127,249,0.08);
            border-radius: 4px;
            padding: 2px 4px;
            white-space: pre-wrap;
            display: inline;
            border: 1px solid #e3eaf3;
            font-size: 1em;
            box-shadow: 0 1px 2px rgba(45,127,249,0.07);
          }
        `}
      </style>
      {isEmpty ? (
        <div className="flex gap-2 items-start w-full">
          <img
            src="/ai-assistant.png"
            alt="AI Assistant"
            className="w-8 h-8 rounded-full border border-gray-300 bg-white"
            style={{ flexShrink: 0 }}
          />
          <div className="w-full">
            <div
              className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800"
              style={{
                whiteSpace: "pre-wrap",
                marginTop: 4,
                maxWidth: "100%",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              Hello! How can I help you?
            </div>
          </div>
        </div>
      ) : (
        messages
          .filter(msg => !(msg.from === "ai" && msg.text.trim() === "__RUN_CODE_DONE__"))
          .map((msg, idx) => {
            if (msg.from === "ai") {
              // Try to parse as JSON and check for id/type/title
              let parsed: any = null;
              try {
                parsed = JSON.parse(msg.text);
              } catch {}
              if (
                parsed &&
                typeof parsed === "object" &&
                parsed.id &&
                parsed.type &&
                parsed.title
              ) {
                return (
                  <div key={idx} className="flex gap-2 items-start w-full">
                    <img
                      src="/ai-assistant.png"
                      alt="AI Assistant"
                      className="w-8 h-8 rounded-full border border-gray-300 bg-white"
                      style={{ flexShrink: 0 }}
                    />
                    <div className="w-full">
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800">
                        <a
                          href={
                            parsed.type === "problem"
                              ? `/problem-detail/?problemId=${parsed.id}`
                              : `/lesson/?id=${parsed.id}`
                          }
                          className="text-blue-600 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {parsed.title
                            ? `Go to: ${parsed.title}`
                            : parsed.type === "problem"
                            ? `Go to suggested problem #${parsed.id}`
                            : `Go to suggested lesson #${parsed.id}`}
                        </a>
                      </div>
                    </div>
                  </div>
                );
              }
            }
            
            return msg.from === "ai" ? (
              <div key={idx} className="flex gap-2 items-start w-full">
                <img
                  src="/ai-assistant.png"
                  alt="AI Assistant"
                  className="w-8 h-8 rounded-full border border-gray-300 bg-white"
                  style={{ flexShrink: 0 }}
                />
                <div className="w-full">
                  <div
                    className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800"
                    style={{
                      whiteSpace: "pre-wrap",
                      marginTop: 4,
                      maxWidth: "100%",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {
                      // Show a sign if the AI response is __RUN_CODE__
                      msg.text.trim() === "__RUN_CODE__" ? (
                        <div className="flex items-center gap-2 text-blue-600 font-semibold">
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M13 2.05v2.02A8.001 8.001 0 0 1 20 12h2.02A10.001 10.001 0 0 0 13 2.05ZM4.93 4.93A9.953 9.953 0 0 0 2.05 13h2.02A8.001 8.001 0 0 1 12 4V2.05a9.953 9.953 0 0 0-7.07 2.88ZM12 20a8.001 8.001 0 0 1-8-8H2.05a10.001 10.001 0 0 0 2.88 7.07A9.953 9.953 0 0 0 11 21.95V20Zm7.07-2.93A9.953 9.953 0 0 0 21.95 11h-2.02A8.001 8.001 0 0 1 12 20v1.95a9.953 9.953 0 0 0 7.07-2.88ZM12 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6Zm-1 3h2v4h-2V9Zm0 6h2v2h-2v-2Z"/></svg>
                          <span>Running your code...</span>
                        </div>
                      ) : (
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
                              let text = msg.text
                                .replace(/(\n__SESSION_ID__.*$)/, "")
                                .replace(/(^|\n)\* (?!\*)(.*)/g, '$1- $2')
                                .replace(/^(__RUN_CODE__)+/, "")      // Remove one or more __RUN_CODE__ at the start
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
                      )
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div key={idx} className="flex gap-2 items-start justify-end w-full">
                <div className="w-full">
                  <div
                    className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-900 text-left"
                    style={{
                      whiteSpace: "pre-wrap",
                      marginTop: 4,
                      maxWidth: "100%",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
                <img
                  src="/avatar.png"
                  alt="User"
                  className="w-8 h-8 rounded-full border border-gray-300 bg-white"
                  style={{ flexShrink: 0 }}
                />
              </div>
            )
          })
      )}
      <div ref={endRef} />
    </div>
  );
}
