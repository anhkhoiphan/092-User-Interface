import { useSelector } from "react-redux";
import { spaces, rooms } from "../../data/mockData";

function SpaceRoomList({
  activeSpace,
  activeRoom,
  setActiveRoom,
  searchQuery,
  setSearchQuery,
}) {
  const { isDark } = useSelector((state) => state.theme);

  const spaceRooms = rooms[activeSpace] || [];

  return (
    <div
      className="w-60 min-w-60 flex flex-col h-screen border-r"
      style={{
        background: "var(--bg-surface-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div
        className="p-4 border-b"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div
          className="text-base font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          {spaces.find((s) => s.id === activeSpace)?.name || "Space"}
        </div>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md text-sm outline-none transition-colors"
          style={{
            background: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--input-text)",
          }}
          placeholder="Tìm kiếm room..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {spaceRooms
          .filter((room) =>
            room.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((room) => (
            <div
              key={room.id}
              className="flex items-center px-2.5 py-2 rounded-md cursor-pointer transition-colors gap-2 mb-0.5"
              style={{
                background:
                  activeRoom === room.id
                    ? "var(--primary-active)"
                    : "transparent",
              }}
              onMouseEnter={(e) => {
                if (activeRoom !== room.id)
                  e.currentTarget.style.background = "var(--hover-primary)";
              }}
              onMouseLeave={(e) => {
                if (activeRoom !== room.id)
                  e.currentTarget.style.background = "transparent";
              }}
              onClick={() => setActiveRoom(room.id)}
            >
              <span
                className="text-base font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                {room.isBot ? room.icon : "#"}
              </span>
              <span
                className="flex-1 text-sm truncate"
                style={{
                  color:
                    activeRoom === room.id || room.hasNotification
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  fontWeight:
                    activeRoom === room.id || room.hasNotification
                      ? "600"
                      : "400",
                }}
              >
                {room.name}
              </span>
              {room.hasNotification && room.unreadCount && (
                <span
                  className="flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                  style={{
                    background: "var(--notification)",
                    color: isDark ? "var(--bg-surface)" : "#fff",
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
          ))}
      </div>
    </div>
  );
}

export default SpaceRoomList;
