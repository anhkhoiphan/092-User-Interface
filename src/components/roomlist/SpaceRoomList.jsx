import { useState } from "react";
import { useSelector } from "react-redux";
import { FiSearch, FiPlus, FiSliders } from "react-icons/fi";
import { spaces, rooms } from "../../data/mockData";

function RoomItem({ room, isActive, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center px-3 py-2.5 rounded-md cursor-pointer transition-colors gap-2.5 mb-0.5"
      style={{
        background: isActive
          ? "var(--primary-active)"
          : isHovered
            ? "var(--hover-primary)"
            : "transparent",
        borderRadius: "8px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Room info - no avatar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {room.displayName || room.name}
          </div>
        </div>
        <div
          className="text-xs mt-0.5 truncate"
          style={{ color: "var(--text-secondary)" }}
        >
          {room.lastMessage || "Chưa có tin nhắn"}
        </div>
      </div>

      {/* Notification badge */}
      {room.hasNotification && room.unreadCount && (
        <span
          className="flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
          style={{
            background: "var(--notification)",
            color: "#fff",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
          }}
        >
          {room.unreadCount}
        </span>
      )}
      {room.hasNotification && !room.unreadCount && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: "var(--notification)" }}
        />
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <span
        className="w-2 h-2 rounded-full animate-bounce"
        style={{ background: "var(--text-muted)", animationDelay: "0ms" }}
      />
      <span
        className="w-2 h-2 rounded-full animate-bounce"
        style={{ background: "var(--text-muted)", animationDelay: "150ms" }}
      />
      <span
        className="w-2 h-2 rounded-full animate-bounce"
        style={{ background: "var(--text-muted)", animationDelay: "300ms" }}
      />
    </div>
  );
}

function EmptyState({ isDark }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div
        className="w-14 h-14 rounded-lg flex items-center justify-center mb-3"
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        }}
      >
        <FiSearch size={24} style={{ color: "var(--text-muted)" }} />
      </div>
      <div
        className="text-sm font-medium mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        Không tìm thấy room nào
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        Thử tìm kiếm với từ khóa khác nhé
      </div>
    </div>
  );
}

function SpaceRoomList({
  activeSpace,
  activeRoom,
  setActiveRoom,
  searchQuery,
  setSearchQuery,
  onCreateRoomClick,
}) {
  const { isDark } = useSelector((state) => state.theme);
  const [isSearching, setIsSearching] = useState(false);

  const spaceRooms = rooms[activeSpace] || [];

  const filteredRooms = spaceRooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      setIsSearching(true);
      setTimeout(() => setIsSearching(false), 300);
    } else {
      setIsSearching(false);
    }
  };

  return (
    <div
      className="w-60 min-w-60 flex flex-col h-screen border-r"
      style={{
        background: "var(--bg-surface-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* Header */}
      <div
        className="p-4 border-b"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {spaces.find((s) => s.id === activeSpace)?.name || "Space"}
          </div>
          <button
            onClick={() => console.log("Space settings clicked")}
            className="p-1.5 rounded hover:opacity-70 transition-opacity cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            title="Cài đặt space"
          >
            <FiSliders size={14} />
          </button>
        </div>
        <div className="relative">
          <FiSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm outline-none transition-colors"
            style={{
              background: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--input-text)",
            }}
            placeholder="Tìm kiếm room..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto p-2">
        {isSearching && <LoadingDots />}

        {!isSearching && filteredRooms.length === 0 && (
          <EmptyState isDark={isDark} />
        )}

        {!isSearching && filteredRooms.length > 0 && (
          <div>
            <div
              className="flex items-center justify-between px-3 py-2"
            >
              <div
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Rooms
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCreateRoomClick) onCreateRoomClick();
                }}
                className="p-1 rounded hover:opacity-70 transition-opacity cursor-pointer"
                style={{ color: "var(--text-muted)" }}
                title="Tạo room mới"
              >
                <FiPlus size={14} />
              </button>
            </div>
            {filteredRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={activeRoom === room.id}
                onClick={() => setActiveRoom(room.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SpaceRoomList;
