type Props = {
  onSend: (text: string) => void;
};

import { useState } from "react";

export default function AIAssistantInput({ onSend }: Props) {
  const [input, setInput] = useState("");
  return (
    <form
      className="flex border-t"
      onSubmit={e => {
        e.preventDefault();
        if (input.trim()) {
          onSend(input);
          setInput("");
        }
      }}
    >
      <input
        className="flex-1 px-3 py-2 text-sm border-none focus:ring-0 rounded-bl-xl"
        placeholder="Type your message..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button
        type="submit"
        className="px-4 py-2 text-lamaPurple font-semibold hover:text-lamaPurpleLight transition"
      >
        Send
      </button>
    </form>
  );
}