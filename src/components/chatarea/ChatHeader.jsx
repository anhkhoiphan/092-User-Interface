import { getUserColor } from "../../utils/userColor";

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
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden"
        style={{
          background: userColor,
          color: textColor,
        }}
      >
        {avatarEmoji ? (
          <span className="text-base">{avatarEmoji}</span>
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
      {!isBot && (
        <div
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
          style={{
            borderColor: isDark ? "var(--bg-surface-secondary)" : "#fff",
            background: isOnline ? "var(--online)" : "var(--offline)",
          }}
        />
      )}
    </div>
  );
}

function ChatHeader({ isDark, activeRoom, isBotRoom, isDM, dmUser }) {
  const hasNoSelection = isDM && !dmUser;

  const headerTitle = hasNoSelection
    ? "Tin nhắn"
    : isBotRoom
      ? "Trợ lý AI"
      : isDM && dmUser
        ? dmUser.name
        : `# ${activeRoom}`;

  const headerSubtitle = hasNoSelection
    ? "Chọn một cuộc trò chuyện để bắt đầu"
    : isBotRoom
      ? "Hỏi đáp với trợ lý AI"
      : isDM && dmUser
        ? dmUser.isOnline
          ? "Đang hoạt động"
          : "Ngoại tuyến"
        : "Giải tích - tuần 1";

  return (
    <div
      className="px-4 py-3 border-b flex-shrink-0 flex items-center gap-3"
      style={{
        borderColor: "var(--border-primary)",
        background: "var(--bg-surface-secondary)",
      }}
    >
      {(isBotRoom || (isDM && dmUser)) && (
        <UserAvatar
          name={isBotRoom ? "Trợ lý AI" : dmUser.name}
          avatarUrl={isBotRoom ? "🤖" : dmUser.avatar}
          color={isBotRoom ? null : dmUser?.color}
          isOnline={isBotRoom ? true : dmUser?.isOnline}
          isDark={isDark}
          isBot={isBotRoom}
        />
      )}
      <div className="min-w-0">
        <div
          className="text-[15px] font-semibold flex items-center gap-1.5 truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {headerTitle}
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          {headerSubtitle}
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;
