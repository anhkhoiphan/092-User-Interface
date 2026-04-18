import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  PiGraduationCap,
  PiRobot,
  PiFolder,
  PiPencil,
  PiComputerTower,
  PiBooks,
  PiStudent,
  PiFlask,
  PiFunction,
  PiChartBar,
} from "react-icons/pi";
import { cancelCreateSpace } from "../../store/slices/appSlice";

const spaceIcons = [
  { id: "graduation", icon: PiGraduationCap },
  { id: "robot", icon: PiRobot },
  { id: "folder", icon: PiFolder },
  { id: "pencil", icon: PiPencil },
  { id: "computer", icon: PiComputerTower },
  { id: "books", icon: PiBooks },
  { id: "student", icon: PiStudent },
  { id: "flask", icon: PiFlask },
  { id: "function", icon: PiFunction },
  { id: "chart", icon: PiChartBar },
];

function CreateSpace() {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const [spaceName, setSpaceName] = useState("");
  const [spaceIcon, setSpaceIcon] = useState(spaceIcons[0].id);
  const [spaceDescription, setSpaceDescription] = useState("");

  const handleSubmit = () => {
    if (spaceName.trim()) {
      const newSpace = {
        id: spaceName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        name: spaceName.trim(),
        icon: spaceIcon,
        description: spaceDescription.trim(),
        hasNotification: false,
      };
      console.log("Creating space:", newSpace);
      dispatch(cancelCreateSpace());
    }
  };

  const selectedIconData = spaceIcons.find((s) => s.id === spaceIcon);
  const SelectedIcon = selectedIconData?.icon || PiGraduationCap;

  return (
    <div
      className="flex-1 flex flex-col min-w-0"
      style={{ background: "var(--bg-surface)" }}
    >
      <div
        className="px-4 py-3 border-b flex-shrink-0"
        style={{
          borderColor: "var(--border-primary)",
          background: "var(--bg-surface-secondary)",
        }}
      >
        <div
          className="text-[15px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Tạo Space mới
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Tạo không gian học tập mới
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Icon Selection */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Chọn icon
            </h3>
            <div className="flex flex-wrap gap-2">
              {spaceIcons.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSpaceIcon(id)}
                  className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background:
                      spaceIcon === id
                        ? "var(--primary)"
                        : "var(--card-bg-secondary)",
                    color:
                      spaceIcon === id
                        ? isDark
                          ? "var(--bg-surface)"
                          : "#fff"
                        : "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (spaceIcon !== id)
                      e.currentTarget.style.background = "var(--hover-primary)";
                  }}
                  onMouseLeave={(e) => {
                    if (spaceIcon !== id)
                      e.currentTarget.style.background =
                        "var(--card-bg-secondary)";
                  }}
                >
                  <Icon size={24} />
                </button>
              ))}
            </div>
          </div>

          {/* Space Name */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Tên Space
            </h3>
            <input
              type="text"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder="VD: Toán cao cấp, Lập trình AI..."
              className="w-full px-3 py-2 rounded-md text-sm border outline-none"
              style={{
                background: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--primary)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--input-border)")
              }
            />
          </div>

          {/* Description */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Mô tả (tùy chọn)
            </h3>
            <textarea
              value={spaceDescription}
              onChange={(e) => setSpaceDescription(e.target.value)}
              placeholder="Mô tả ngắn về space này..."
              rows={3}
              className="w-full px-3 py-2 rounded-md text-sm border outline-none resize-none"
              style={{
                background: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--primary)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--input-border)")
              }
            />
          </div>

          {/* Preview */}
          {spaceName && (
            <div>
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Xem trước
              </h3>
              <div
                className="p-4 rounded-lg flex items-center gap-3"
                style={{ background: "var(--card-bg-secondary)" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--primary)" }}
                >
                  <SelectedIcon
                    size={24}
                    color={isDark ? "var(--bg-surface)" : "#fff"}
                  />
                </div>
                <div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {spaceName}
                  </div>
                  {spaceDescription && (
                    <div
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {spaceDescription}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className="px-6 py-4 border-t flex justify-end gap-3"
        style={{
          borderColor: "var(--border-primary)",
          background: "var(--bg-surface-secondary)",
        }}
      >
        <button
          onClick={() => dispatch(cancelCreateSpace())}
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--hover-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          disabled={!spaceName.trim()}
          className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "var(--primary)",
            color: isDark ? "var(--bg-surface)" : "#fff",
          }}
          onMouseEnter={(e) => {
            if (spaceName.trim())
              e.currentTarget.style.background = "var(--primary-hover)";
          }}
          onMouseLeave={(e) => {
            if (spaceName.trim())
              e.currentTarget.style.background = "var(--primary)";
          }}
        >
          Tạo Space
        </button>
      </div>
    </div>
  );
}

export default CreateSpace;
