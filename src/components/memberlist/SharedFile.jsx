import { FiFileText, FiImage, FiFile } from "react-icons/fi";

function SharedFile({ isDark, fileName, time, type }) {
  // Get icon based on file type
  const getIcon = () => {
    if (type === "image") {
      return <FiImage size={12} />;
    }
    if (type === "pdf") {
      return <FiFile size={12} />;
    }
    return <FiFileText size={12} />;
  };

  // Get icon color based on type
  const getIconColor = () => {
    if (type === "pdf") {
      return "#ef4444";
    }
    if (type === "image") {
      return "#10b981";
    }
    return "var(--primary)";
  };

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-md cursor-pointer"
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--hover-primary)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center text-xs flex-shrink-0"
        style={{
          background: "var(--primary-active)",
          color: getIconColor(),
        }}
      >
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-xs truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {fileName}
        </div>
        <div
          className="text-[11px] mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          Gửi lúc {time}
        </div>
      </div>
    </div>
  );
}

export default SharedFile;
