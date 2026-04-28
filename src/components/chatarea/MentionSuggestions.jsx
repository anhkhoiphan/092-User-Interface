import { useState, useEffect, useRef } from "react";
import { dmUsers } from "../../data/mockData";

const AGENT_MENTION = {
  id: "__AGENT__",
  name: "agent",
  avatar: "🤖",
  isBot: true,
  isAgent: true,
  email: "agent@vinclassroom.edu.vn",
};

function MentionSuggestions({
  onSelect,
  isDark,
  filterText,
  selectedIndex: externalSelectedIndex = 0,
}) {
  const [selectedIndex, setSelectedIndex] = useState(externalSelectedIndex);
  const listRef = useRef(null);

  // Filter users based on filterText, include Agent option
  const filteredUsers = dmUsers.filter((user) =>
    user.name.toLowerCase().includes((filterText || "").toLowerCase()),
  );

  // Add Agent to the list if filter matches "agent" or empty
  const lowerFilter = (filterText || "").toLowerCase();
  const showAgent =
    !lowerFilter ||
    "agent".includes(lowerFilter) ||
    lowerFilter.includes("agent") ||
    lowerFilter.includes("trợ") ||
    lowerFilter.includes("lý") ||
    lowerFilter.includes("ai");

  const allSuggestions = showAgent
    ? [AGENT_MENTION, ...filteredUsers]
    : filteredUsers;

  console.log("[MentionSuggestions] filter:", lowerFilter, "showAgent:", showAgent, "suggestions:", allSuggestions.map((s) => s.name));

  // Reset selected index when filter changes or external index changes
  useEffect(() => {
    setSelectedIndex(externalSelectedIndex);
  }, [filterText, externalSelectedIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allSuggestions.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter" && allSuggestions[selectedIndex]) {
        e.preventDefault();
        onSelect(allSuggestions[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onSelect(null); // Close suggestions
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, allSuggestions, onSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (filteredUsers.length === 0) {
    return (
      <div
        className="px-3 py-2 text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        Không tìm thấy người dùng
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="max-h-48 overflow-y-auto"
      style={{
        background: isDark ? "var(--bg-surface-secondary)" : "#fff",
      }}
    >
      {allSuggestions.map((user, index) => (
        <button
          key={user.id}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer`}
          style={{
            background:
              index === selectedIndex ? "var(--hover-primary)" : "transparent",
          }}
          onClick={() => onSelect(user)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{
              background: user.isAgent
                ? "var(--tertiary-active)"
                : user.isBot
                  ? "var(--tertiary-active)"
                  : "var(--primary)",
              color: user.isBot ? "var(--tertiary)" : "#fff",
            }}
          >
            {user.avatar}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div
              className="font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {user.isAgent ? "@agent" : user.name}
            </div>
            {user.isAgent && (
              <div
                className="text-xs"
                style={{ color: "var(--tertiary)" }}
              >
                Trợ lý AI — Gọi Agent để trả lờ
              </div>
            )}
            {user.isBot && !user.isAgent && (
              <div
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Bot
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export default MentionSuggestions;
