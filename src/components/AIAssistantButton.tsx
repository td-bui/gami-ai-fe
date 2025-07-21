import React from "react";

interface AIAssistantButtonProps {
  onClick: () => void;
  showHintPopup?: boolean;
  hintMessage?: string;
}

const BUTTON_SIZE = 64;

const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({
  onClick,
  showHintPopup = false,
  hintMessage = "Stuck? Open AI assistant to get hint.",
}) => {
  console.log("Hint Popup:", showHintPopup);

  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 80, // 20px + button size (64px)
        zIndex: 50,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
      }}
    >
      {showHintPopup && (
        <div
          style={{
            position: "absolute",
            bottom: BUTTON_SIZE + 16, // 16px gap above the button
            right: 0, // align right edge of popup to left edge of button
            background: "white",
            border: "1px solid #6366f1",
            borderRadius: 8,
            padding: 12,
            zIndex: 9999,
            boxShadow: "0 2px 8px rgba(99,102,241,0.15)",
            minWidth: 220,
            textAlign: "center",
            pointerEvents: "auto",
            transition: "opacity 0.2s",
          }}
        >
          <span style={{ color: "#3730a3", fontWeight: 500 }}>
            {hintMessage}
          </span>
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 16, // align triangle to right edge of popup
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "10px solid #6366f1",
            }}
          />
        </div>
      )}
      <button
        className="shadow-lg rounded-full bg-white border border-gray-200 hover:scale-105 transition your-ai-assistant-btn-class"
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          padding: 0,
          pointerEvents: "auto",
        }}
        onClick={onClick}
        aria-label="Open AI Assistant"
      >
        <img
          src="/ai-assistant.png"
          alt="AI Assistant"
          className="w-full h-full object-cover rounded-full"
        />
      </button>
    </div>
  );
};

export default AIAssistantButton;