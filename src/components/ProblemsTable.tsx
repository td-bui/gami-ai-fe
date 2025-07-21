import Link from "next/link";
import React from "react";

type Problem = {
  id: number;
  title: string;
  difficulty: string;
  topicName: string;
  isSolved: boolean;
};

interface Props {
  problems: Problem[];
}

export default function ProblemsTable({ problems }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-3 px-4 text-left">Title</th>
            <th className="py-3 px-4 text-left">Difficulty</th>
            <th className="py-3 px-4 text-left">Topic</th>
            <th className="py-3 px-4 text-left">Status</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {problems.map((problem, idx) => (
            <tr
              key={problem.id}
              className={`border-t transition-colors ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-indigo-50`}
            >
              <td className="py-3 px-4 font-medium">
                <Link
                  href={`/problem-detail?problemId=${problem.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {problem.title}
                </Link>
              </td>
              <td className="py-3 px-4">
                <span
                  className={
                    "inline-block px-3 py-1 rounded-full text-xs font-semibold " +
                    (problem.difficulty === "easy"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : problem.difficulty === "medium"
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                      : "bg-red-100 text-red-700 border border-red-200")
                  }
                >
                  {problem.difficulty}
                </span>
              </td>
              <td className="py-3 px-4">
                {problem.topicName || (
                  <span className="text-gray-400">Unknown</span>
                )}
              </td>
              <td className="py-3 px-4">
                {problem.isSolved ? (
                  <span className="inline-block bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold">
                    Solved
                  </span>
                ) : (
                  <span className="inline-block bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold">
                    Unsolved
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                <Link
                  href={`/problem-detail?problemId=${problem.id}`}
                  className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 transition font-semibold"
                >
                  Solve
                </Link>
              </td>
            </tr>
          ))}
          {problems.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-8 text-gray-400">
                No problems found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}