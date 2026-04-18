import { useState } from "react";
import { FiMessageSquare, FiCornerDownRight, FiEdit2 } from "react-icons/fi";
import { getUserColor } from "../../utils/userColor";

const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

/**
 * Reply preview shown below sender info
 */
export function ReplyPreview({ replyTo, isDark }) {
  if (!replyTo) return null;
  const replyColor = getUserColor(replyTo.sender);

  return (
    <div
      className="mb-2 px-2 py-1.5 rounded-md text-xs border-l-2 flex items-center gap-2"
      style={{
        borderColor: replyColor,
        background: isDark ? "var(--bg-surface-tertiary)" : "#f0f2f5",
      }}
    >
      <FiCornerDownRight
        size={12}
        style={{ color: replyColor, flexShrink: 0 }}
      />
      <span style={{ color: replyColor, fontWeight: "600", flexShrink: 0 }}>
        {replyTo.sender}
      </span>
      <span className="truncate" style={{ color: "var(--text-secondary)" }}>
        {replyTo.content}
      </span>
    </div>
  );
}

/**
 * Reaction bar showing existing reactions
 */
export function ReactionBar({ reactions, onAddReaction, isDark }) {
  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {reactions?.map((reaction, idx) => (
        <button
          key={idx}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border transition-colors"
          style={{
            background: isDark ? "var(--bg-surface-tertiary)" : "#f0f2f5",
            borderColor: isDark ? "var(--border-secondary)" : "#e2e6ed",
          }}
          onClick={() => onAddReaction(reaction.emoji)}
        >
          <span>{reaction.emoji}</span>
          <span style={{ color: "var(--text-secondary)" }}>
            {reaction.count}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Reaction picker popup
 */
export function ReactionPicker({ show, onSelect, isDark }) {
  if (!show) return null;

  return (
    <div
      className="absolute bottom-8 right-0 flex gap-1 p-1 rounded-lg shadow-lg z-20"
      style={{
        background: isDark ? "var(--bg-surface-secondary)" : "#fff",
        border: "1px solid var(--border-primary)",
      }}
    >
      {quickReactions.map((emoji) => (
        <button
          key={emoji}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-opacity-20 transition-colors"
          style={{
            background: isDark ? "var(--hover-primary)" : "#f0f2f5",
          }}
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

/**
 * Action buttons shown on hover (reply, edit, reactions)
 */
export function MessageActions({
  show,
  isDark,
  isOwnMessage,
  onReply,
  onEdit,
  onReaction,
  showPicker,
  onTogglePicker,
}) {
  if (!show) return null;

  return (
    <div
      className="absolute -top-2 right-2 flex items-center gap-1 z-10"
      style={{
        background: isDark ? "var(--bg-surface-secondary)" : "#fff",
        border: "1px solid var(--border-primary)",
        borderRadius: "9999px",
        padding: "2px 4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      {/* Quick reactions */}
      {quickReactions.slice(0, 3).map((emoji) => (
        <button
          key={emoji}
          className="w-6 h-6 flex items-center justify-center rounded text-sm hover:scale-125 transition-transform"
          onClick={() => onReaction(emoji)}
        >
          {emoji}
        </button>
      ))}
      {/* Reply button */}
      <button
        className="w-7 h-7 flex items-center justify-center rounded-full transition-all"
        style={{
          color: "var(--text-secondary)",
        }}
        onClick={onReply}
        title="Reply"
      >
        <FiMessageSquare size={14} />
      </button>
      {/* Edit button (only for own messages) */}
      {isOwnMessage && onEdit && (
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full transition-all"
          style={{
            color: "var(--text-secondary)",
          }}
          onClick={onEdit}
          title="Edit message"
        >
          <FiEdit2 size={13} />
        </button>
      )}
      {/* Add reaction button */}
      <div className="relative">
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full transition-all"
          style={{
            color: "var(--text-secondary)",
          }}
          onClick={onTogglePicker}
          title="Add reaction"
        >
          <span className="text-sm font-bold">+</span>
        </button>
        <ReactionPicker
          show={showPicker}
          onSelect={onReaction}
          isDark={isDark}
        />
      </div>
    </div>
  );
}
