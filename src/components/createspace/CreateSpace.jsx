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
  PiCode,
  PiGlobe,
  PiMusicNotes,
  PiPalette,
  PiCamera,
  PiGameController,
  PiHeart,
  PiStar,
  PiRocket,
  PiBrain,
  PiCalculator,
  PiCalendar,
  PiUsers,
  PiTrophy,
  PiFlag,
  PiSun,
  PiMoon,
  PiCloud,
  PiHouse,
  PiCar,
  PiAirplane,
  PiBasketball,
  PiGuitar,
  PiPhone,
  PiLaptop,
  PiCoffee,
  PiPizza,
  PiFirstAid,
  PiLockKey,
  PiMoney,
  PiGift,
  PiFire,
  PiSnowflake,
} from "react-icons/pi";
import { cancelCreateSpace } from "../../store/slices/appSlice";

const spaceIcons = [
  { id: "graduation", icon: PiGraduationCap, label: "Tốt nghiệp" },
  { id: "robot", icon: PiRobot, label: "Robot" },
  { id: "folder", icon: PiFolder, label: "Thư mục" },
  { id: "pencil", icon: PiPencil, label: "Bút chì" },
  { id: "computer", icon: PiComputerTower, label: "Máy tính" },
  { id: "books", icon: PiBooks, label: "Sách" },
  { id: "student", icon: PiStudent, label: "Học sinh" },
  { id: "flask", icon: PiFlask, label: "Thí nghiệm" },
  { id: "code", icon: PiCode, label: "Lập trình" },
  { id: "globe", icon: PiGlobe, label: "Thế giới" },
  { id: "music", icon: PiMusicNotes, label: "Âm nhạc" },
  { id: "palette", icon: PiPalette, label: "Mỹ thuật" },
  { id: "camera", icon: PiCamera, label: "Nhiếp ảnh" },
  { id: "game", icon: PiGameController, label: "Game" },
  { id: "heart", icon: PiHeart, label: "Yêu thích" },
  { id: "star", icon: PiStar, label: "Ngôi sao" },
  { id: "rocket", icon: PiRocket, label: "Tên lửa" },
  { id: "brain", icon: PiBrain, label: "Trí tuệ" },
  { id: "calculator", icon: PiCalculator, label: "Máy tính" },
  { id: "calendar", icon: PiCalendar, label: "Lịch" },
  { id: "users", icon: PiUsers, label: "Nhóm" },
  { id: "trophy", icon: PiTrophy, label: "Cúp" },
  { id: "flag", icon: PiFlag, label: "Cờ" },
  { id: "sun", icon: PiSun, label: "Mặt trờii" },
  { id: "moon", icon: PiMoon, label: "Mặt trăng" },
  { id: "cloud", icon: PiCloud, label: "Mây" },
  { id: "house", icon: PiHouse, label: "Nhà" },
  { id: "car", icon: PiCar, label: "Xe hơi" },
  { id: "airplane", icon: PiAirplane, label: "Máy bay" },
  { id: "basketball", icon: PiBasketball, label: "Bóng rổ" },
  { id: "guitar", icon: PiGuitar, label: "Guitar" },
  { id: "phone", icon: PiPhone, label: "Điện thoại" },
  { id: "laptop", icon: PiLaptop, label: "Laptop" },
  { id: "coffee", icon: PiCoffee, label: "Cà phê" },
  { id: "pizza", icon: PiPizza, label: "Pizza" },
  { id: "firstaid", icon: PiFirstAid, label: "Sơ cứu" },
  { id: "lock", icon: PiLockKey, label: "Khóa" },
  { id: "money", icon: PiMoney, label: "Tiền" },
  { id: "gift", icon: PiGift, label: "Quà" },
  { id: "fire", icon: PiFire, label: "Lửa" },
  { id: "snowflake", icon: PiSnowflake, label: "Bông tuyết" },
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
