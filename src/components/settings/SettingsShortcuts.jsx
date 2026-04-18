import { FiMail, FiPhone } from "react-icons/fi";

function ShortcutItem({ isDark, label, shortcut }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: "var(--text-primary)" }}>
        {label}
      </span>
      <kbd
        className="text-xs px-1.5 py-0.5 rounded"
        style={{
          background: "var(--card-bg-secondary)",
          color: "var(--text-primary)",
        }}
      >
        {shortcut}
      </kbd>
    </div>
  );
}

function SettingsShortcuts({ isDark }) {
  return (
    <div
      className="w-60 min-w-60 flex flex-col h-screen overflow-y-auto border-l"
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
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Thông tin nhanh
        </div>
      </div>
      <div className="flex-1 p-4">
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--card-bg-secondary)" }}
        >
          <div
            className="text-xs font-medium mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Phím tắt
          </div>
          <div className="space-y-2">
            <ShortcutItem isDark={isDark} label="Cài đặt" shortcut="Ctrl+," />
            <ShortcutItem isDark={isDark} label="Dark mode" shortcut="Ctrl+D" />
            <ShortcutItem isDark={isDark} label="Tạo space" shortcut="Ctrl+N" />
          </div>
        </div>
        <div
          className="mt-4 p-4 rounded-lg"
          style={{ background: "var(--card-bg-secondary)" }}
        >
          <div
            className="text-xs font-medium mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Hỗ trợ
          </div>
          <div
            className="text-xs space-y-1"
            style={{ color: "var(--text-primary)" }}
          >
            <p className="flex items-center gap-2">
              <FiMail size={12} /> support@vinclassroom.edu.vn
            </p>
            <p className="flex items-center gap-2">
              <FiPhone size={12} /> 1900 xxxx
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsShortcuts;
