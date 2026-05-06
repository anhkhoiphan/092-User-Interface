import { FiPlus, FiSettings } from "react-icons/fi";
import { getSpaceIconComponent } from "../../constants/spaceIcons";

// Built-in system icons (not from space registry)
const systemIcons = {
  plus: FiPlus,
  settings: FiSettings,
};

function SpaceIcon({ icon, name, isActive, hasNotification, onClick, title }) {
  // Try space registry first, then system icons
  const IconComponent = getSpaceIconComponent(icon) || systemIcons[icon] || FiPlus;

  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 relative"
      style={{
        background: isActive ? "var(--primary)" : "transparent",
        color: isActive ? "var(--bg-surface)" : "var(--text-tertiary)",
        borderRadius: isActive ? "0.75rem" : "0.5rem",
      }}
      onClick={onClick}
      title={title}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "var(--hover-primary)";
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.borderRadius = "0.75rem";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-tertiary)";
          e.currentTarget.style.borderRadius = "0.5rem";
        }
      }}
    >
      <IconComponent size={20} />
      {hasNotification && (
        <div
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2"
          style={{
            background: "var(--online)",
            borderColor: "var(--bg-surface)",
          }}
        />
      )}
    </div>
  );
}

export default SpaceIcon;
