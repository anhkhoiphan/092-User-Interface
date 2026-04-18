import { getUserColor } from "../../utils/userColor";

function MemberItem({ isDark, member, onClick }) {
  const memberColor = getUserColor(member.name, member.color);

  return (
    <div
      className="flex items-center gap-2.5 p-2 rounded-md cursor-pointer"
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--hover-primary)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      onClick={() => onClick?.()}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0 relative"
        style={{
          background: member.isBot ? "var(--tertiary-active)" : memberColor,
          color: member.isBot
            ? "var(--tertiary)"
            : isDark
              ? "var(--bg-surface)"
              : "#fff",
        }}
      >
        {member.avatar}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
          style={{
            borderColor: isDark ? "var(--bg-surface-secondary)" : "#fff",
            background: member.isOnline ? "var(--online)" : "var(--offline)",
          }}
        />
      </div>
      <span
        className="text-[13px] flex-1"
        style={{ color: member.isOnline ? memberColor : "var(--text-muted)" }}
      >
        {member.name}
      </span>
      {member.isBot && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{
            background: "var(--tertiary-active)",
            color: "var(--tertiary)",
          }}
        >
          Trợ lý
        </span>
      )}
    </div>
  );
}

export default MemberItem;
