import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FiSearch, FiPlus, FiSliders } from "react-icons/fi";
import { createRoom } from "../../store/slices/spaceSlice";
import { setActiveRoom } from "../../store/slices/appSlice";

function RoomItem({ room, isActive, onClick, lastMessage, lastMessageTime, unreadCount }) {
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
      {/* Room info */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="text-sm font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {room.name}
            </div>
            {room.is_private && (
              <span
                className="text-[10px] px-1 py-0.5 rounded flex-shrink-0"
                style={{
                  background: "var(--primary-active)",
                  color: "var(--primary)",
                }}
              >
                Private
              </span>
            )}
          </div>
          {/* Last message time */}
          {lastMessageTime && (
            <span
              className="text-[10px] flex-shrink-0 ml-1"
              style={{ color: "var(--text-muted)" }}
            >
              {lastMessageTime}
            </span>
          )}
        </div>
        {/* Last message */}
        <div
          className="text-xs mt-0.5 truncate"
          style={{
            color: unreadCount > 0
              ? "var(--text-primary)"
              : "var(--text-secondary)",
            fontWeight: unreadCount > 0 ? 500 : 400,
          }}
        >
          {lastMessage || "Bắt đầu trò chuyện"}
        </div>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span
          className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0"
          style={{ background: "#ef4444", lineHeight: 1 }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
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

function EmptyState({ isDark, onCreateRoomClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div
        className="w-14 h-14 rounded-lg flex items-center justify-center mb-3"
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        }}
      >
        <FiPlus size={24} style={{ color: "var(--text-muted)" }} />
      </div>
      <div
        className="text-sm font-medium mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        Chưa có room nào
      </div>
      <div className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        Tạo room đầu tiên để bắt đầu thảo luận
      </div>
      <button
        onClick={onCreateRoomClick}
        className="px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer"
        style={{
          background: "var(--primary)",
          color: "#fff",
        }}
      >
        Tạo room mới
      </button>
    </div>
  );
}

function CreateRoomModal({ isOpen, onClose, onCreate, isDark }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate({
        name: name.trim(),
        description: description.trim(),
        isPrivate,
      });
      setName("");
      setDescription("");
      setIsPrivate(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-md rounded-lg p-6 shadow-xl"
        style={{
          background: "var(--bg-surface-secondary)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Tạo Room mới
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Tên room
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Thảo luận, Tài liệu..."
              className="w-full px-3 py-2 rounded-md text-sm border outline-none"
              style={{
                background: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
              autoFocus
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Mô tả (tùy chọn)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về room..."
              className="w-full px-3 py-2 rounded-md text-sm border outline-none"
              style={{
                background: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
              style={{ accentColor: "var(--primary)" }}
            />
            <label
              htmlFor="isPrivate"
              className="text-sm cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
            >
              Room riêng tư
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              style={{
                background: "var(--primary)",
                color: isDark ? "var(--bg-surface)" : "#fff",
              }}
            >
              Tạo
            </button>
          </div>
        </form>
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
  const dispatch = useDispatch();
  const [isSearching, setIsSearching] = useState(false);

  const { spaces, roomsMap, roomsLoading, fetchedRooms } = useSelector(
    (state) => state.space,
  );
  const currentUser = useSelector((state) => state.auth.user);

  const spaceRooms = roomsMap[activeSpace] || [];
  const isFetched = fetchedRooms[activeSpace];

  // Helper to format last message from API
  const getRoomLastMessage = (room) => {
    const lastMsg = room.last_message;
    if (!lastMsg) return null;
    const isOwn = lastMsg.sender_id && currentUser?.id && String(lastMsg.sender_id) === String(currentUser.id);
    const senderName = isOwn ? "Bạn" : (lastMsg.sender_display_name || lastMsg.username || "Unknown");
    return {
      content: lastMsg.content,
      senderName,
    };
  };

  // Rooms are already fetched globally in App.jsx
  // This component only reads from Redux store, no need to fetch here

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

  const handleCreateRoom = (roomData) => {
    if (activeSpace) {
      dispatch(createRoom({ spaceId: activeSpace, data: roomData }));
    }
  };

  const currentSpace = spaces.find((s) => s.id === activeSpace);

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
            className="text-base font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {currentSpace?.name || "Space"}
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
        {/* Header with create button — always visible */}
        <div className="flex items-center justify-between px-3 py-2">
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

        {(roomsLoading || isSearching) && <LoadingDots />}

        {!roomsLoading && !isSearching && filteredRooms.length === 0 && (
          <EmptyState isDark={isDark} onCreateRoomClick={onCreateRoomClick} />
        )}

        {!isSearching && filteredRooms.length > 0 && (
          <div>
            {filteredRooms.map((room) => {
              const lastMsg = getRoomLastMessage(room);
              return (
                <RoomItem
                  key={room.id}
                  room={room}
                  isActive={activeRoom === room.id}
                  onClick={() => setActiveRoom(room.id)}
                  lastMessage={lastMsg ? `${lastMsg.senderName}: ${lastMsg.content}` : null}
                  unreadCount={room.unreadCount || 0}
                />
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
}

export default SpaceRoomList;
