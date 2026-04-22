function CollapsedPanel({ position, onClick, title }) {
  const isLeft = position === "left";

  return (
    <div
      className="flex flex-col items-center justify-center cursor-pointer border-r"
      style={{
        width: "8px",
        minWidth: "8px",
        height: "100vh",
        background: "var(--bg-surface-secondary)",
        borderColor: "var(--border-primary)",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--hover-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-surface-secondary)";
      }}
      title={title}
    >
      <div
        className="w-[2px] h-8 rounded-full"
        style={{ background: "var(--border-primary)" }}
      />
    </div>
  );
}

export default CollapsedPanel;
