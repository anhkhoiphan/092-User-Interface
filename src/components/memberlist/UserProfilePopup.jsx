import { useState } from "react";
import { FiUserPlus, FiMessageSquare, FiX } from "react-icons/fi";
import { getUserColor } from "../../utils/userColor";

function UserProfilePopup({
  user,
  isDark,
  onClose,
  onAddFriend,
  onSendMessage,
}) {
  const [messageInput, setMessageInput] = useState("");
  const userColor = getUserColor(user.name, user.color);

  const handleSendMessage = () => {
    if (messageInput.trim() && onSendMessage) {
      onSendMessage(user, messageInput);
      setMessageInput("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-2xl overflow-hidden"
        style={{
          width: "300px",
          background: isDark ? "var(--bg-surface-secondary)" : "#fff",
          border: `1px solid ${isDark ? "var(--border-secondary)" : "#e2e6ed"}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded transition-colors z-10"
          style={{ background: "transparent", color: "var(--text-secondary)" }}
          onClick={onClose}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--hover-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <FiX size={16} />
        </button>

        {/* Banner */}
        <div className="h-16" style={{ background: userColor }} />

        {/* Avatar */}
        <div className="px-4 -mt-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold border-4 relative"
            style={{
              background: userColor,
              color: isDark ? "var(--bg-surface)" : "#fff",
              borderColor: isDark ? "var(--bg-surface-secondary)" : "#fff",
            }}
          >
            {user.avatar}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2"
              style={{
                borderColor: isDark ? "var(--bg-surface-secondary)" : "#fff",
                background: user.isOnline ? "var(--online)" : "var(--offline)",
              }}
            />
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 pt-3 pb-4">
          <div
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {user.name}
          </div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {user.email || `${user.name.toLowerCase()}@vinclassroom.edu.vn`}
          </div>

          {/* Mutual Friends */}
          {user.mutualFriends !== undefined && (
            <div
              className="mt-3 pt-3"
              style={{
                borderTop: `1px solid ${isDark ? "var(--border-secondary)" : "#e2e6ed"}`,
              }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Bạn chung
              </div>
              <div
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {user.mutualFriends} bạn chung
              </div>
            </div>
          )}

          {/* Shared Spaces */}
          {user.sharedSpaces && user.sharedSpaces.length > 0 && (
            <div
              className="mt-3 pt-3"
              style={{
                borderTop: `1px solid ${isDark ? "var(--border-secondary)" : "#e2e6ed"}`,
              }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Space chung
              </div>
              <div className="flex flex-wrap gap-1">
                {user.sharedSpaces.map((space) => (
                  <span
                    key={space}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: isDark
                        ? "var(--bg-surface-tertiary)"
                        : "#f0f2f5",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {space}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            {!user.isFriend && onAddFriend && (
              <button
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: "var(--primary)",
                  color: isDark ? "var(--bg-surface)" : "#fff",
                }}
                onClick={() => {
                  onAddFriend(user);
                  onClose();
                }}
              >
                <FiUserPlus size={14} />
                Kết bạn
              </button>
            )}
            {onSendMessage && (
              <button
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: isDark ? "var(--bg-surface-tertiary)" : "#f0f2f5",
                  color: "var(--text-primary)",
                }}
                onClick={() => {
                  onSendMessage(user);
                  onClose();
                }}
              >
                <FiMessageSquare size={14} />
                Nhắn tin
              </button>
            )}
          </div>

          {/* Quick DM Box */}
          {onSendMessage && (
            <div
              className="mt-4 pt-3"
              style={{
                borderTop: `1px solid ${isDark ? "var(--border-secondary)" : "#e2e6ed"}`,
              }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Nhắn tin nhanh
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border rounded-md text-sm outline-none transition-colors"
                  style={{
                    background: isDark
                      ? "var(--bg-surface-tertiary)"
                      : "#f0f2f5",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                  }}
                  placeholder={`Nhắn cho ${user.name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && messageInput.trim())
                      handleSendMessage();
                  }}
                />
                <button
                  className="w-9 h-9 flex items-center justify-center rounded-md transition-colors"
                  style={{
                    background: messageInput.trim()
                      ? "var(--primary)"
                      : "var(--bg-surface-tertiary)",
                    color: messageInput.trim()
                      ? isDark
                        ? "var(--bg-surface)"
                        : "#fff"
                      : "var(--text-muted)",
                  }}
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <FiMessageSquare size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfilePopup;
