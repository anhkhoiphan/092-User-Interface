import { FiFile, FiDownload, FiImage } from "react-icons/fi";

/**
 * FileAttachment component - displays file attachments in messages
 * Supports PDF, images, and other file types
 */
function FileAttachment({ attachment, isDark, onDownload }) {
  const { name, type, url } = attachment;

  // Handle click to download/view
  const handleClick = () => {
    if (onDownload) {
      onDownload(attachment);
    } else if (url) {
      window.open(url, "_blank");
    }
  };

  // Render image attachment
  if (type === "image") {
    return (
      <div
        className="mt-2 rounded-lg overflow-hidden border cursor-pointer max-w-md"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--border-primary)",
        }}
        onClick={handleClick}
      >
        <div className="relative">
          <img
            src={url}
            alt={name}
            className="w-full h-auto object-cover max-h-80"
            onError={(e) => {
              e.target.style.display = "none";
              const parent = e.target.parentElement;
              if (parent) {
                const errorDiv = document.createElement("div");
                errorDiv.className =
                  "w-full h-40 flex items-center justify-center";
                errorDiv.style.background = "var(--bg-surface-tertiary)";
                errorDiv.innerHTML =
                  '<span style="color: var(--text-secondary); font-size: 0.875rem;">Không thể tải ảnh</span>';
                parent.appendChild(errorDiv);
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Render PDF attachment
  if (type === "pdf") {
    return (
      <div
        className=" flex items-center gap-3 mt-2 px-3 py-3 border rounded-lg cursor-pointer max-w-md transition-colors"
        style={{
          background: isDark ? "var(--bg-surface-tertiary)" : "#fef2f2",
          borderColor: "var(--border-primary)",
        }}
        onClick={handleClick}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
          style={{
            background: "#ef4444",
            color: "#fff",
          }}
        >
          <FiFile size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {name}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            PDF Document
          </div>
        </div>
        <FiDownload
          size={16}
          style={{ color: "var(--text-secondary)", flexShrink: 0 }}
        />
      </div>
    );
  }

  // Render other file types
  return (
    <div
      className="flex items-center gap-3 mt-2 px-3 py-3 border rounded-lg cursor-pointer max-w-md transition-colors"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--border-primary)",
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-primary)";
      }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
        style={{
          background: isDark ? "var(--bg-surface-secondary)" : "#e5e7eb",
          color: "var(--text-secondary)",
        }}
      >
        <FiFile size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {name}
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          {getFileExtension(name)}
        </div>
      </div>
      <FiDownload
        size={16}
        style={{ color: "var(--text-secondary)", flexShrink: 0 }}
      />
    </div>
  );
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename) {
  const ext = filename.split(".").pop().toUpperCase();
  return `${ext} File`;
}

export default FileAttachment;
