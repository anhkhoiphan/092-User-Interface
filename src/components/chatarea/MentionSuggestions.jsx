import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";

function MentionSuggestions({
  onSelect,
  isDark,
  filterText,
  selectedIndex: externalSelectedIndex = 0,
}) {
  const [selectedIndex, setSelectedIndex] = useState(externalSelectedIndex);
  const listRef = useRef(null);

  // Get real users from Redux store (space members + DM conversations)
  const { conversations } = useSelector((state) => state.dm);
  const { membersMap } = useSelector((state) => state.space);

  // Build user list from real data
  const allUsers = (() => {
    const users = [];
    const seenIds = new Set();

    // Always add StudyBot at the top
    users.push({
      id: "studybot",
      name: "StudyBot",
      avatar: "🤖",
      isBot: true,
    });
    seenIds.add("studybot");

    // Add users from DM conversations
    conversations.forEach((conv) => {
      const ou = conv.other_user;
      if (ou && !seenIds.has(ou.id)) {
        seenIds.add(ou.id);
        users.push({
          id: ou.id,
          name: ou.display_name || ou.name || "Unknown",
          avatar: ou.display_name?.charAt(0).toUpperCase() || ou.name?.charAt(0).toUpperCase() || "?",
          isBot: false,
        });
      }
    });

    // Add users from space members
    Object.values(membersMap).flat().forEach((member) => {
      if (member && !seenIds.has(member.id)) {
        seenIds.add(member.id);
        users.push({
          id: member.id,
          name: member.display_name || member.name || member.email || "Unknown",
          avatar: member.display_name?.charAt(0).toUpperCase() || member.name?.charAt(0).toUpperCase() || "?",
          isBot: false,
        });
      }
    });

    return users;
  })();

  // Filter users based on filterText
  const filteredUsers = allUsers.filter((user) =>
    user.name.toLowerCase().includes((filterText || "").toLowerCase()),
  );

  const allSuggestions = filteredUsers;

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
              background: user.isBot
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
              {user.name}
            </div>
            {user.isBot && (
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
