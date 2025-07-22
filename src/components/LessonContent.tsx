"use client";

import React, { useEffect, useState } from "react";
import parse from "html-react-parser";
import ExampleBlock from "./ExampleBlock";
import QuizSection from "./QuizSection";
import { authFetch } from "@/utils/authFetch";// Adjust the import path as needed
import { useRouter } from "next/navigation"; // Add this import
import { createRoot } from "react-dom/client";

// Helper to inject code examples into HTML content
function injectExamples(html: string, examples: any[]) {
  let result = html;
  examples?.forEach((ex) => {
    const block = `<div id="example-block-${ex.codeId}"></div>`;
    result = result.replace(
      `<div data-code-id="${ex.codeId}"></div>`,
      block
    );
  });
  return result;
}

function parseLessonContentWithExamples(html: string, examples: any[]) {
  return parse(html, {
    replace: (domNode) => {
      if (
        domNode.type === "tag" &&
        domNode.name === "div" &&
        domNode.attribs &&
        domNode.attribs["data-code-id"]
      ) {
        const codeId = domNode.attribs["data-code-id"];
        const ex = examples.find((e: any) => e.codeId === codeId);
        if (ex) return <ExampleBlock ex={ex} />;
      }
    },
  });
}

const LessonContent = React.memo(function LessonContent({
  lesson,
}: {
  lesson: any;
}) {
  const htmlWithExamples = injectExamples(lesson.content, lesson.examples);

  useEffect(() => {
    lesson.examples?.forEach((ex: any) => {
      const el = document.getElementById(`example-block-${ex.codeId}`);
      if (el) {
        import("react-dom/client").then(({ createRoot }) => {
          const root = createRoot(el);
          root.render(<ExampleBlock ex={ex} />);
        });
      }
    });
  }, [lesson]);

  // --- Quiz loading logic ---
  const [quizSection, setQuizSection] = useState<{
    completed: boolean;
    quizCompleted: boolean;
    quizzes: any[] | null;
  } | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    if (!lesson.id) return;
    setQuizLoading(true);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    authFetch(`${apiBaseUrl}/api/lessons/${lesson.id}/quizzes`, {
    })
      .then((res) => res.json())
      .then((data) => {
        setQuizSection(data);
        setQuizLoading(false);
      })
      .catch(() => setQuizLoading(false));
  }, [lesson.id]);

  const router = useRouter();

  const handleRetakeQuiz = async () => {
    setQuizLoading(true);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const res = await authFetch(`${apiBaseUrl}/api/lessons/${lesson.id}/reset-quiz`, {
        method: "PUT"
      });
      const data = await res.json();
      setQuizSection(data);
    } catch (e) {
      // handle error if needed
    }
    setQuizLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="prose prose-slate max-w-none mb-6 custom-lesson-content">
        {/* Render your HTML content, but replace example placeholders with ExampleBlock */}
        {parseLessonContentWithExamples(lesson.content, lesson.examples)}
      </div>
      {/* Quiz logic */}
      {quizLoading && (
        <div className="text-center text-gray-500 my-8">Loading quizzes...</div>
      )}
      {!quizLoading && quizSection && (
        <>
          {quizSection.completed ? (
            <div className="flex justify-center my-8">
              <button
                className="px-6 py-2 rounded bg-blue-600 text-white font-bold"
                onClick={handleRetakeQuiz}
                disabled={quizLoading}
              >
                Retake the Quizzes
              </button>
            </div>
          ) : quizSection.quizCompleted ? (
            <div className="flex justify-center my-8">
              <button
                className="px-6 py-2 rounded bg-green-600 text-white font-bold"
                onClick={() => router.push(`/problem-detail?lessonId=${lesson.id}`)}
              >
                Do More Exercises
              </button>
            </div>
          ) : (
            quizSection.quizzes && quizSection.quizzes.length > 0 && (
              <QuizSection quizzes={quizSection.quizzes} lessonId={lesson.id} />
            )
          )}
        </>
      )}
      <style jsx global>{`
        .custom-lesson-content h1 {
          color: #7c3aed;
          font-size: 2.25rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
        }
        .custom-lesson-content h2 {
          color: #2563eb;
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .custom-lesson-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
        }
        .custom-lesson-content li {
          margin-bottom: 0.5rem;
        }
        .custom-lesson-content code {
          background: #f3f4f6;
          color: #d97706;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 1em;
          /* For inline code only */
        }
        .custom-lesson-content pre {
          background: #1e293b;
          color: #f1f5f9;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          font-size: 1em;
          overflow-x: auto;
          margin: 1.5rem 0;
          box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
        }
        /* Style code blocks inside pre */
        .custom-lesson-content pre code {
          background: none;      /* Remove inline code background */
          color: inherit;        /* Use pre's color */
          padding: 0;
          border-radius: 0;
          font-size: 1em;
          font-family: 'Fira Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
          display: block;
          white-space: pre;
        }
        .custom-lesson-content p {
          margin-bottom: 1rem;
        }
        .custom-lesson-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5rem 0;
          background: #fff;
          box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
          border-radius: 8px;
          overflow: hidden;
        }
        .custom-lesson-content th,
        .custom-lesson-content td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem 1rem;
          text-align: left;
        }
        .custom-lesson-content th {
          background: #f3f4f6;
          font-weight: 700;
          color: #374151;
        }
        .custom-lesson-content tr:nth-child(even) td {
          background: #f9fafb;
        }
        .custom-lesson-content tr:hover td {
          background: #eef2ff;
          transition: background 0.2s;
        }
      `}</style>
    </div>
  );
});

export default LessonContent;