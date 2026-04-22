import { useState } from "react";
import { useSelector } from "react-redux";
import { FiPlusSquare, FiUserPlus, FiUsers } from "react-icons/fi";

function CreateSpaceGuide({ onTabChange }) {
  const { isDark } = useSelector((state) => state.theme);
  const [activeTab, setActiveTab] = useState("space");

  const menuItems = [
    {
      icon: FiPlusSquare,
      title: "Tạo Space",
      desc: "Tạo không gian mới",
      tab: "space",
    },
    {
      icon: FiUserPlus,
      title: "Tạo Agent",
      desc: "Tạo agent mới",
      tab: "agent",
    },
    {
      icon: FiUsers,
      title: "Quản lý Agent",
      desc: "Xem và quản lý các agent",
      tab: "manageAgent",
    },
  ];

  const handleClick = (tab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

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
          Tạo mới
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <div
              key={item.title}
              className="p-3 rounded-lg cursor-pointer flex items-start gap-3"
              style={{
                background: isActive
                  ? "var(--primary-active)"
                  : "transparent",
                color: isActive ? "var(--primary)" : "var(--text-primary)",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "var(--hover-primary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "transparent";
              }}
              onClick={() => handleClick(item.tab)}
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

export default CreateSpaceGuide;
