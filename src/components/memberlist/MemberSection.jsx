import MemberItem from "./MemberItem";

function MemberSection({ isDark, title, members, onMemberClick }) {
  return (
    <>
      <div
        className="text-[11px] font-semibold uppercase tracking-wider px-2 py-2"
        style={{ color: "var(--text-muted)" }}
      >
        {title} — {members.length}
      </div>
      {members.map((member) => (
        <MemberItem
          key={member.id}
          isDark={isDark}
          member={member}
          onClick={() => onMemberClick?.(member)}
        />
      ))}
    </>
  );
}

export default MemberSection;
