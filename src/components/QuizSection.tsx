import { authFetch } from "@/utils/authFetch";
import { useState, useEffect } from "react";
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaTimesCircle, FaRedo } from "react-icons/fa";
import toast from "react-hot-toast";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

// Helper function to parse the question
const parseQuestion = (question: string) => {
  // Add the 's' flag to the end of the regex to match newlines
  const codeRegex = /<pre><code class='language-python'>(.*?)<\/code><\/pre>/s;
  const match = question.match(codeRegex);

  if (!match) {
    return { textBefore: question, code: null, textAfter: null };
  }

  const code = match[1];
  const parts = question.split(match[0]);
  return {
    textBefore: parts[0],
    code: code,
    textAfter: parts[1] || null,
  };
};

const QuizSection = ({
  quizzes,
  lessonId
}: {
  quizzes: any[];
  lessonId: number;
}) => {
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>(Array(quizzes.length).fill(null));
  const [checking, setChecking] = useState(false);
  // Update state type to include xpGained
  const [checkResult, setCheckResult] = useState<{ allCorrect: boolean; wrongQuizIds: number[]; isCompleted: boolean; xpGained: number } | null>(null);

  useEffect(() => {
    setQuizIndex(0);
    setAnswers(Array(quizzes.length).fill(null));
    setCheckResult(null);
  }, [quizzes]);

  useEffect(() => {
    setSelected(answers[quizIndex]);
  }, [quizIndex, answers]);

  if (!quizzes || quizzes.length === 0) return null;

  const quiz = quizzes[quizIndex];

  const handleSelect = (opt: string) => {
    const letter = opt.split(".")[0].trim();
    setSelected(letter);
    const newAnswers = [...answers];
    newAnswers[quizIndex] = letter;
    setAnswers(newAnswers);
  };

  const handleNext = () => setQuizIndex((i) => i + 1);
  const handlePrev = () => setQuizIndex((i) => i - 1);

  const allAnswered = answers.every((a) => a !== null);

  const handleSubmit = async () => {
    setChecking(true);
    setCheckResult(null);
    const answersMap: { [quizId: number]: string } = {};
    quizzes.forEach((q, i) => {
      answersMap[q.id] = answers[i] || "";
    });
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await authFetch(
        `${apiBaseUrl}/api/lessons/${lessonId}/check-quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: localStorage.getItem("userId"),
            lessonId,
            answers: answersMap,
          }),
        }
      );
      const data = await res.json();
      setCheckResult(data);
      // Show toast if XP was gained
      if (data.xpGained && data.xpGained > 0) {
        toast.success(`You gained ${data.xpGained} XP! ✨`);
      }
    } catch (err) {
      setCheckResult({ allCorrect: false, wrongQuizIds: [], isCompleted: false, xpGained: 0 });
      toast.error("Failed to check answers. Please try again.");
    }
    setChecking(false);
  };

  const handleReset = () => {
    setAnswers(Array(quizzes.length).fill(null));
    setQuizIndex(0);
    setSelected(null);
    setCheckResult(null);
  };

  const { textBefore, code, textAfter } = parseQuestion(quiz.question);

  return (
    <section className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow p-6 mb-8">
      <h3 className="text-xl font-bold mb-4 text-yellow-700 flex items-center gap-2">
        <span role="img" aria-label="Quiz">📝</span> Quiz
      </h3>
      <div className="mb-6">
        <div className="mb-2 font-semibold text-gray-800">
          <div className="flex items-center gap-2">
            <span>{textBefore}</span>
            {checkResult && (
              checkResult.wrongQuizIds.includes(quiz.id) ? (
                <FaTimesCircle className="text-red-500" title="Wrong" />
              ) : (
                <FaCheckCircle className="text-green-500" title="Correct" />
              )
            )}
          </div>
          {code && (
            <div className="my-4">
              <SyntaxHighlighter language="python" style={oneLight} customStyle={{ borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                {code.trim()}
              </SyntaxHighlighter>
            </div>
          )}
          {textAfter && <span>{textAfter}</span>}
        </div>
        <ul className="mb-2">
          {quiz.options.map((opt: string, idx: number) => {
            const letter = opt.split(".")[0].trim();
            return (
              <li key={idx} className="mb-1">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name={`quiz-${quizIndex}`}
                    className="mr-2"
                    value={letter}
                    checked={selected === letter}
                    onChange={() => handleSelect(opt)}
                    disabled={!!checkResult || checking}
                  />
                  {opt}
                </label>
              </li>
            );
          })}
        </ul>
        {!checkResult && allAnswered && (
          <div className="flex justify-center">
            <button
              className="mt-6 px-6 py-2 rounded bg-green-600 text-white font-bold"
              onClick={handleSubmit}
              disabled={checking}
            >
              {checking ? "Checking..." : "Submit All Answers"}
            </button>
          </div>
        )}
        {checking && (
          <div className="flex justify-center mt-4">
            <span className="text-yellow-700 font-semibold">Checking your answers...</span>
          </div>
        )}
        {checkResult && (
          <div className="mt-6 flex flex-col items-center">
            {checkResult.allCorrect ? (
              <div className="text-green-700 font-bold mb-2">All answers correct! 🎉</div>
            ) : (
              <div className="text-red-600 font-bold mb-2">
                Some answers are incorrect!
              </div>
            )}
            <button
              className="mt-2 px-4 py-2 rounded bg-gray-400 text-white font-bold flex items-center gap-2"
              onClick={handleReset}
            >
              <FaRedo /> Reset
            </button>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 mt-4">
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-semibold disabled:opacity-50 transition mr-4"
            onClick={handlePrev}
            disabled={quizIndex === 0 || checking}
            aria-label="Previous"
          >
            <FaArrowLeft />
          </button>
          <span className="text-sm text-gray-500">
            Quiz {quizIndex + 1} of {quizzes.length}
          </span>
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-semibold disabled:opacity-50 transition ml-4"
            onClick={handleNext}
            disabled={quizIndex === quizzes.length - 1 || selected === null || checking}
            aria-label="Next"
          >
            <FaArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
};

export default QuizSection;