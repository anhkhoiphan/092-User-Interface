import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FiLogOut } from "react-icons/fi";
import { logout } from "../../store/slices/authSlice";
import ThemeToggle from "./ThemeToggle";
import UserProfile from "./UserProfile";

function SettingsView() {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const [saveState, setSaveState] = useState({
    saved: false,
    message: "",
    isError: false,
  });
  const [saving, setSaving] = useState(false);
  const profileRef = useRef(null);

  const handleSave = async () => {
    setSaving(true);
    const result = await profileRef.current?.validateAndSave();
    setSaving(false);

    if (!result) return;

    if (!result.success) {
      if (result.error) {
        setSaveState({ saved: true, message: result.error, isError: true });
        setTimeout(() => setSaveState({ saved: false, message: "", isError: false }), 3000);
      }
      return;
    }

    const msg = result.changed
      ? "✓ Đã cập nhật!"
      : "✓ Đã lưu!";
    setSaveState({ saved: true, message: msg, isError: false });
    setTimeout(() => setSaveState({ saved: false, message: "", isError: false }), 2000);
  };

  return (
    <div
      className="flex-1 flex flex-col min-w-0"
      style={{ background: "var(--bg-surface)" }}
    >
      <div
        className="px-4 py-3 border-b shrink-0"
        style={{
          borderColor: "var(--border-primary)",
          background: "var(--bg-surface-secondary)",
        }}
      >
        <div
          className="text-[15px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Cài đặt tài khoản
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Quản lý thông tin cá nhân
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Theme Toggle */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Giao diện
            </h3>
            <ThemeToggle />
          </div>

          {/* User Profile */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Thông tin cá nhân
            </h3>
            <UserProfile ref={profileRef} />
          </div>

          {/* About */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Về ứng dụng
            </h3>
            <div
              className="p-4 rounded-lg"
              style={{ background: "var(--card-bg-secondary)" }}
            >
              <div className="text-sm" style={{ color: "var(--text-primary)" }}>
                <p className="font-medium mb-1">VinClassroom</p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Nền tảng học tập trực tuyến - Phiên bản 1.0.0
                </p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div>
            <button
              className="w-full px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              style={{
                background: "var(--card-bg-secondary)",
                color: "var(--danger)",
                border: "1px solid var(--border-primary)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--hover-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--card-bg-secondary)")
              }
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                  dispatch(logout());
                }
              }}
            >
              <FiLogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div
        className="px-6 py-4 border-t flex justify-end gap-3"
        style={{
          borderColor: "var(--border-primary)",
          background: "var(--bg-surface-secondary)",
        }}
      >
        {saveState.saved && (
          <span
            className="text-sm mr-auto"
            style={{ color: saveState.isError ? "var(--danger)" : "var(--online)" }}
          >
            {saveState.message}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{
            background: saving ? "var(--text-muted)" : "var(--primary)",
            color: isDark ? "var(--bg-surface)" : "#fff",
            opacity: saving ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!saving) e.currentTarget.style.background = "var(--primary-hover)";
          }}
          onMouseLeave={(e) => {
            if (!saving) e.currentTarget.style.background = "var(--primary)";
          }}
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}

export default SettingsView;
