import { FiMessageSquare } from "react-icons/fi";

function MessagesButton({ isActive, onClick }) {
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 relative"
      style={{
        background: isActive ? "var(--primary)" : "transparent",
        color: isActive ? "var(--bg-surface)" : "var(--text-tertiary)",
        borderRadius: isActive ? "0.75rem" : "0.5rem",
      }}
      onClick={onClick}
      title="Messages"
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "var(--hover-primary)";
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.borderRadius = "0.75rem";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-tertiary)";
          e.currentTarget.style.borderRadius = "0.5rem";
        }
      }}
    >
      <FiMessageSquare size={20} />
    </div>
  );
}

export default MessagesButton;
