import { useState, useEffect } from "react";

/**
 * Header section for DMList with title and search
 */
export function DMListHeader({ searchQuery, setSearchQuery }) {
  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearchQuery(inputValue.trim());
    }
  };

  return (
    <div
      className="p-4 border-b"
      style={{ borderColor: "var(--border-primary)" }}
    >
      <div className="mb-3">
        <div
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Tin nhắn
        </div>
      </div>
      <input
        type="text"
        className="w-full px-3 py-2 border rounded-md text-sm outline-none transition-colors"
        style={{
          background: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--input-text)",
        }}
        placeholder="Tìm kiếm bạn bè..."
        data-dm-search
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

/**
 * Reusable section for DMList (e.g., Friends, Non-friends, Friend Requests)
 */
export function DMListSection({ title, children }) {
  if (!children || children.length === 0) return null;

  return (
    <div className="mb-4">
      <div
        className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
