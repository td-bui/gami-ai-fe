import React, { useState, useEffect } from "react";

interface Topic {
  id: string;
  name: string;
}
interface Props {
  show: boolean;
  onClose: () => void;
  statuses: string[];
  difficulties: string[];
  topics: Topic[];
  selectedStatus: string | null;
  selectedDifficulty: string | null;
  selectedTopic: string | null;
  setSelectedStatus: (v: string | null) => void;
  setSelectedDifficulty: (v: string | null) => void;
  setSelectedTopic: (v: string | null) => void;
}

export default function FilterModal({
  show,
  onClose,
  statuses,
  difficulties,
  topics,
  selectedStatus,
  selectedDifficulty,
  selectedTopic,
  setSelectedStatus,
  setSelectedDifficulty,
  setSelectedTopic,
}: Props) {
  // Local state for modal fields
  const [localStatus, setLocalStatus] = useState<string | null>(selectedStatus);
  const [localDifficulty, setLocalDifficulty] = useState<string | null>(selectedDifficulty);
  const [localTopic, setLocalTopic] = useState<string | null>(selectedTopic);

  // Sync local state with props when modal opens
  useEffect(() => {
    if (show) {
      setLocalStatus(selectedStatus);
      setLocalDifficulty(selectedDifficulty);
      setLocalTopic(selectedTopic);
    }
  }, [show, selectedStatus, selectedDifficulty, selectedTopic]);

  const handleSave = () => {
    setSelectedStatus(localStatus);
    setSelectedDifficulty(localDifficulty);
    setSelectedTopic(localTopic);
    onClose();
  };

  const handleReset = () => {
    setLocalStatus(null);
    setLocalDifficulty(null);
    setLocalTopic(null);
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Blur overlay */}
      <div
        className="absolute inset-0 bg-white/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal content */}
      <div className="relative z-10 min-w-[320px] bg-white border border-gray-200 rounded shadow-lg p-6">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Status */}
          <div className="w-full">
            <label className="block text-xs font-semibold mb-1 text-gray-500">Status</label>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              value={localStatus || ""}
              onChange={(e) => setLocalStatus(e.target.value || null)}
            >
              <option value="">All</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          {/* Difficulty */}
          <div className="w-full">
            <label className="block text-xs font-semibold mb-1 text-gray-500">Difficulty</label>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              value={localDifficulty || ""}
              onChange={(e) => setLocalDifficulty(e.target.value || null)}
            >
              <option value="">All</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
          </div>
          {/* Topic */}
          <div className="w-full">
            <label className="block text-xs font-semibold mb-1 text-gray-500">Topic</label>
            <select
              className="border rounded px-2 py-1 text-sm w-full"
              value={localTopic || ""}
              onChange={(e) => setLocalTopic(e.target.value || null)}
            >
              <option value="">All</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Save and Reset Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-1 rounded border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200"
            onClick={handleReset}
            type="button"
          >
            Reset
          </button>
          <button
            className="px-4 py-1 rounded bg-lamaPurple text-white hover:bg-lamaPurpleLight"
            onClick={handleSave}
            type="button"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}