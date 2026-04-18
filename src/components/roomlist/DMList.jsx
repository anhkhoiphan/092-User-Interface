import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FiMessageSquare, FiUserPlus, FiSearch } from "react-icons/fi";
import { setActiveRoom } from "../../store/slices/appSlice";
import { setSelectedDMUser } from "../../store/slices/chatSlice";
import { getUserColor } from "../../utils/userColor";
import { DMListHeader, DMListSection } from "./DMListComponents";
import { useDMList } from "../../hooks/useDMList";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isEmoji(str) {
  if (!str) return false;
  // Basic emoji detection: any non-BMP character or common emoji ranges
  return /\p{Emoji}/u.test(str) && str.length <= 2;
}

function UserAvatar({ name, avatarUrl, isOnline, isDark, isBot, color }) {
  const userColor = isBot ? "var(--tertiary-active)" : getUserColor(name, color);
  const textColor = isBot
    ? "var(--tertiary)"
    : isDark
      ? "var(--bg-surface)"
      : "#fff";

  const avatarEmoji = isEmoji(avatarUrl) ? avatarUrl : null;
  const imageUrl = avatarUrl && !avatarEmoji ? avatarUrl : null;

  return (
    <div className="relative flex-shrink-0">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden"
        style={{
          background: userColor,
          color: textColor,
        }}
      >
        {avatarEmoji ? (
          <span className="text-lg">{avatarEmoji}</span>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          getInitials(name)
        )}
      </div>
      <div
        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
        style={{
          borderColor: isDark ? "var(--bg-surface-secondary)" : "#fff",
          background: isOnline ? "var(--online)" : "var(--offline)",
        }}
      />
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

function NoResultsState({ isDark }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
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
        Không tìm thấy kết quả
      </div>
      <div
        className="text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        Thử tìm kiếm với từ khóa khác nhé
      </div>
    </div>
  );
}

function EmptyState({ isDark, onStartChat }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        }}
      >
        <FiMessageSquare size={28} style={{ color: "var(--text-muted)" }} />
      </div>
      <div
        className="text-sm font-medium mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        Chưa có cuộc trò chuyện nào
      </div>
      <div
        className="text-xs leading-relaxed mb-4"
        style={{ color: "var(--text-muted)" }}
      >
        Hãy tìm kiếm và nhắn tin với bạn bè
        <br />
        để bắt đầu kết nối nhé!
      </div>
      <button
        onClick={onStartChat}
        className="px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer"
        style={{
          background: "var(--primary)",
          color: "#fff",
        }}
      >
        Tìm bạn bè
      </button>
    </div>
  );
}

function DMItem({
  dm,
  isDark,
  isActive,
  onClick,
  onAddFriend,
  isOnline,
}) {
  const dmColor = getUserColor(dm.name, dm.color);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center px-3 py-2.5 rounded-md cursor-pointer transition-colors gap-2.5 mb-0.5"
      style={{
        background: isActive
          ? "var(--primary-active)"
          : isHovered
            ? isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.03)"
            : "transparent",
        borderRadius: "8px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <UserAvatar
        name={dm.name}
        avatarUrl={dm.avatar}
        isOnline={isOnline}
        isDark={isDark}
        isBot={dm.isBot}
        color={dm.color}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="text-sm font-medium" style={{ color: dmColor }}>
            {dm.name}
          </div>
        </div>
        <div
          className="text-xs mt-0.5 truncate"
          style={{
            color: dm.hasNewMessage
              ? "var(--text-primary)"
              : "var(--text-secondary)",
          }}
        >
          {dm.lastMessage || (dm.isBot ? "Trợ lý AI" : "Bắt đầu trò chuyện")}
        </div>
      </div>
    </div>
  );
}

function DMList({ activeRoom, setActiveRoom: setActiveRoomProp }) {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const [sentRequests, setSentRequests] = useState([]);

  const {
    items,
    onlineStatus,
    searchQuery,
    setSearchQuery,
    isLoading,
    isSearching,
    isSearchingActive,
    getUserOnlineStatus,
  } = useDMList();

  const handleNavigateToChat = (user) => {
    dispatch(setSelectedDMUser(user));
    if (setActiveRoomProp) {
      setActiveRoomProp(user.id);
    } else {
      dispatch(setActiveRoom(user.id));
    }
  };

  const handleAddFriend = (user) => {
    setSentRequests([...sentRequests, user.id]);
    console.log("Sent friend request to:", user.name);
  };

  const handleFocusSearch = () => {
    const input = document.querySelector("[data-dm-search]");
    if (input) input.focus();
  };

  const showEmpty =
    !isLoading && !isSearching && items.length === 0 && !isSearchingActive;

  return (
    <div
      className="w-60 min-w-60 flex flex-col h-screen border-r"
      style={{
        background: "var(--bg-surface-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <DMListHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="flex-1 overflow-y-auto p-2 relative">
        {isLoading && <LoadingDots />}

        {isSearching && <LoadingDots />}

        {showEmpty && (
          <EmptyState isDark={isDark} onStartChat={handleFocusSearch} />
        )}

        {!showEmpty && items.length > 0 && (
          <DMListSection
            title={isSearchingActive ? "Kết quả tìm kiếm" : "Tin nhắn"}
          >
            {items.map((dm) => (
              <DMItem
                key={dm.id}
                dm={dm}
                isDark={isDark}
                isActive={activeRoom === dm.id}
                onClick={() => handleNavigateToChat(dm)}
                onAddFriend={handleAddFriend}
                isOnline={getUserOnlineStatus(dm.userId).online}

              />
            ))}
          </DMListSection>
        )}

        {isSearchingActive && items.length === 0 && !isSearching && (
          <NoResultsState isDark={isDark} />
        )}
      </div>
    </div>
  );
}

export default DMList;
