import { useSelector } from "react-redux";
import {
  FiUser,
  FiBell,
  FiAperture,
  FiLock,
  FiHelpCircle,
} from "react-icons/fi";

function SettingsMenu() {
  const { isDark } = useSelector((state) => state.theme);

  const iconMap = {
    "👤": FiUser,
    "🔔": FiBell,
    "🎨": FiAperture,
    "🔒": FiLock,
    "❓": FiHelpCircle,
  };

  const menuItems = [
    { icon: "👤", title: "Tài khoản", desc: "Thông tin cá nhân", active: true },
    { icon: "🔔", title: "Thông báo", desc: "Cài đặt thông báo" },
    { icon: "🎨", title: "Giao diện", desc: "Dark/Light mode" },
    { icon: "🔒", title: "Bảo mật", desc: "Đổi mật khẩu" },
    { icon: "❓", title: "Trợ giúp", desc: "Hướng dẫn sử dụng" },
  ];

  return (
    <div
      className="w-60 min-w-60 flex flex-col h-screen border-r"
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
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Cài đặt
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {menuItems.map((item) => {
          const IconComponent = iconMap[item.icon];
          return (
            <div
              key={item.title}
              className="p-3 rounded-lg cursor-pointer flex items-start gap-3"
              style={{
                background: item.active
                  ? "var(--primary-active)"
                  : "transparent",
                color: item.active ? "var(--primary)" : "var(--text-primary)",
              }}
              onMouseEnter={(e) => {
                if (!item.active)
                  e.currentTarget.style.background = "var(--hover-primary)";
              }}
              onMouseLeave={(e) => {
                if (!item.active)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <IconComponent size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium">{item.title}</div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SettingsMenu;
