import { FaExpand } from "react-icons/fa";

type Props = {
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
};

export default function AIAssistantHeader({ expanded, onExpand, onClose }: Props) {
  return (
    <div className="bg-[#447D9B] text-white px-4 py-2 rounded-t-xl flex items-center justify-between">
      <span className="font-semibold">AI Assistant</span>
      <div className="flex gap-2">
        <button
          className="text-gray-400 hover:text-gray-700 text-xl"
          onClick={onExpand}
          aria-label={expanded ? "Restore chat" : "Expand chat"}
          title={expanded ? "Restore" : "Expand"}
        >
          <FaExpand />
        </button>
        <button
          className="text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Close chat"
        >
          ×
        </button>
      </div>
    </div>
  );
}