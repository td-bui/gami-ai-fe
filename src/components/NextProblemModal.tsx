import React from "react";

export default function NextProblemModal({
  open,
  onCancel,
  onAccept,
  loading,
  text
}: {
  open: boolean;
  onCancel: () => void;
  onAccept: () => void;
  loading?: boolean;
  text: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center min-w-[320px]">
        <h2 className="text-xl font-semibold mb-4">{text}</h2>
        <div className="flex gap-6 mt-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
            onClick={onAccept}
            disabled={loading}
          >
            {loading ? "Loading..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}