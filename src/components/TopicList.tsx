import React from "react";

interface Topic {
  id: string;
  name: string;
}
interface Problem {
  topicName: string;
  // Add other fields as needed
}

interface TopicListProps {
  topics: Topic[];
  expanded: boolean;
  onExpand: () => void;
  problems: Problem[];
  selectedTopic: string | null;
  onTopicClick: (topicCode: string) => void;
}

export default function TopicList({
  topics,
  expanded,
  onExpand,
  problems,
  selectedTopic,
  onTopicClick,
}: TopicListProps) {
  const visibleTopics = expanded ? topics : topics.slice(0, 5);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <button
          className="flex items-center justify-center h-8 w-8 rounded transition hover:bg-gray-100"
          onClick={onExpand}
          aria-label={expanded ? "Collapse topics" : "Expand topics"}
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            fill="currentColor"
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M12 16a1 1 0 0 1-.707-.293l-5-5a1 1 0 0 1 1.414-1.414L12 13.586l4.293-4.293a1 1 0 0 1 1.414 1.414l-5 5A1 1 0 0 1 12 16z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <ul className="flex flex-wrap gap-2 mb-2">
        {visibleTopics.map((topic) => {
          const problemCount = problems.filter((p) => p.topicName === topic.name).length;
          const isSelected = selectedTopic === topic.id;
          return (
            <li
              key={topic.id}
              className={`flex items-center justify-between min-w-[110px] px-4 py-2 rounded-full border transition ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-blue-100"
              }`}
              onClick={() => onTopicClick(topic.id)}
            >
              <span>{topic.name}</span>
              <span className="ml-2 bg-white text-gray-600 rounded-full px-2 py-0.5 text-xs font-semibold border border-gray-300">
                {problemCount}
              </span>
            </li>
          );
        })}
        {!expanded && topics.length > 5 && (
          <li className="flex items-center px-2 text-gray-400 text-xs select-none">
            +{topics.length - 5} more
          </li>
        )}
      </ul>
      <div className="border-b border-gray-200 mb-2" />
    </div>
  );
}