import { FiX, FiFile, FiImage } from "react-icons/fi";

/**
 * FileAttachmentPreview component - shows selected files before sending
 */
function FileAttachmentPreview({ files, onRemove, isDark }) {
  if (!files || files.length === 0) return null;

  const handleRemove = (index) => {
    if (onRemove) {
      onRemove(index);
    }
  };

  return (
    <div
      className="flex flex-wrap gap-2 mb-2 px-3 py-2 rounded-lg text-sm"
      style={{
        background: isDark ? "var(--bg-surface-tertiary)" : "#f0f2f5",
        border: "1px solid var(--border-primary)",
      }}
    >
      {files.map((file, index) => (
        <div
          key={index}
          className="file-preview-item flex items-center gap-2 px-2 py-1.5 rounded-md border"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--border-primary)",
          }}
        >
          {file.type?.startsWith("image/") ? (
            <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
              <img
                src={file.preview}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center w-10 h-10 rounded shrink-0"
              style={{
                background:
                  file.type === "application/pdf"
                    ? "#ef4444"
                    : "var(--bg-surface-secondary)",
                color:
                  file.type === "application/pdf"
                    ? "#fff"
                    : "var(--text-secondary)",
              }}
            >
              {file.type === "application/pdf" ? (
                <FiFile size={16} />
              ) : (
                <FiImage size={16} />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div
              className="text-xs font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {file.name}
            </div>
            <div
              className="text-[10px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {formatFileSize(file.size)}
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 p-0.5 rounded"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => handleRemove(index)}
            title="Xóa file"
          >
            <FiX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Format file size to human-readable format
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default FileAttachmentPreview;
