import { useSelector, useDispatch } from "react-redux";
import { FiSun, FiMoon } from "react-icons/fi";
import { toggleTheme } from "../../store/slices/themeSlice";

function ThemeToggle() {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg"
      style={{ background: "var(--card-bg-secondary)" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl" style={{ color: "var(--text-primary)" }}>
          {isDark ? <FiMoon size={20} /> : <FiSun size={20} />}
        </span>
        <div>
          <div
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {isDark ? "Chế độ tối" : "Chế độ sáng"}
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {isDark
              ? "Đang sử dụng giao diện tối"
              : "Đang sử dụng giao diện sáng"}
          </div>
        </div>
      </div>
      <button
        onClick={() => dispatch(toggleTheme())}
        className="relative w-12 h-6 rounded-full transition-colors"
        style={{ background: isDark ? "var(--primary)" : "var(--text-muted)" }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full shadow transition-transform"
          style={{
            background: "#fff",
            transform: isDark ? "translateX(1.5rem)" : "translateX(0.125rem)",
          }}
        />
      </button>
    </div>
  );
}

export default ThemeToggle;
