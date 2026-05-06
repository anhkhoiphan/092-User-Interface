/**
 * Space Icons Registry — giống pattern usernameColors
 *
 * Cách hoạt động:
 *   1. Server chỉ lưu + trả về `icon_id` (string), KHÔNG lưu URL
 *   2. Frontend có registry này để map `icon_id` → React Component + label
 *   3. Muốn thêm icon mới? Chỉ cần sửa file này ở FE, KHÔNG cần đụng DB
 *
 * Cách dùng ở FE:
 *   import { getSpaceIconComponent, getSpaceIconLabel, spaceIconIds } from "../constants/spaceIcons";
 *
 *   const Icon = getSpaceIconComponent(space.icon_id); // React component
 *   const label = getSpaceIconLabel(space.icon_id);     // "Tốt nghiệp"
 *
 * API Request (FE → Server):
 *   POST /spaces
 *   { name: "Lớp Toán", icon: "graduation", ... }
 *
 * API Response (Server → FE):
 *   { id: "...", name: "Lớp Toán", icon: "graduation", ... }
 */

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

// ==================== Registry ====================

export const spaceIcons = [
  { id: "graduation", label: "Tốt nghiệp", component: PiGraduationCap },
  { id: "robot", label: "Robot", component: PiRobot },
  { id: "folder", label: "Thư mục", component: PiFolder },
  { id: "pencil", label: "Bút chì", component: PiPencil },
  { id: "computer", label: "Máy tính", component: PiComputerTower },
  { id: "books", label: "Sách", component: PiBooks },
  { id: "student", label: "Học sinh", component: PiStudent },
  { id: "flask", label: "Thí nghiệm", component: PiFlask },
  { id: "function", label: "Hàm số", component: PiFunction },
  { id: "chart", label: "Biểu đồ", component: PiChartBar },
  { id: "code", label: "Lập trình", component: PiCode },
  { id: "globe", label: "Thế giới", component: PiGlobe },
  { id: "music", label: "Âm nhạc", component: PiMusicNotes },
  { id: "palette", label: "Mỹ thuật", component: PiPalette },
  { id: "camera", label: "Nhiếp ảnh", component: PiCamera },
  { id: "game", label: "Game", component: PiGameController },
  { id: "heart", label: "Yêu thích", component: PiHeart },
  { id: "star", label: "Ngôi sao", component: PiStar },
  { id: "rocket", label: "Tên lửa", component: PiRocket },
  { id: "brain", label: "Trí tuệ", component: PiBrain },
  { id: "calculator", label: "Máy tính", component: PiCalculator },
  { id: "calendar", label: "Lịch", component: PiCalendar },
  { id: "users", label: "Nhóm", component: PiUsers },
  { id: "trophy", label: "Cúp", component: PiTrophy },
  { id: "flag", label: "Cờ", component: PiFlag },
  { id: "sun", label: "Mặt trờii", component: PiSun },
  { id: "moon", label: "Mặt trăng", component: PiMoon },
  { id: "cloud", label: "Mây", component: PiCloud },
  { id: "house", label: "Nhà", component: PiHouse },
  { id: "car", label: "Xe hơi", component: PiCar },
  { id: "airplane", label: "Máy bay", component: PiAirplane },
  { id: "basketball", label: "Bóng rổ", component: PiBasketball },
  { id: "guitar", label: "Guitar", component: PiGuitar },
  { id: "phone", label: "Điện thoại", component: PiPhone },
  { id: "laptop", label: "Laptop", component: PiLaptop },
  { id: "coffee", label: "Cà phê", component: PiCoffee },
  { id: "pizza", label: "Pizza", component: PiPizza },
  { id: "firstaid", label: "Sơ cứu", component: PiFirstAid },
  { id: "lock", label: "Khóa", component: PiLockKey },
  { id: "money", label: "Tiền", component: PiMoney },
  { id: "gift", label: "Quà", component: PiGift },
  { id: "fire", label: "Lửa", component: PiFire },
  { id: "snowflake", label: "Bông tuyết", component: PiSnowflake },
];

// ==================== Derived Maps ====================

const componentMap = Object.fromEntries(
  spaceIcons.map((s) => [s.id, s.component])
);

const labelMap = Object.fromEntries(
  spaceIcons.map((s) => [s.id, s.label])
);

// ==================== Exports ====================

export const spaceIconIds = spaceIcons.map((s) => s.id);

/**
 * Get React icon component by icon_id
 * @param {string} iconId
 * @returns {React.ComponentType|null}
 */
export function getSpaceIconComponent(iconId) {
  return componentMap[iconId] || null;
}

/**
 * Get display label by icon_id
 * @param {string} iconId
 * @returns {string}
 */
export function getSpaceIconLabel(iconId) {
  return labelMap[iconId] || iconId;
}

/**
 * Check if an icon_id is valid
 * @param {string} iconId
 * @returns {boolean}
 */
export function isValidSpaceIcon(iconId) {
  return iconId in componentMap;
}

/**
 * Get full icon data by icon_id
 * @param {string} iconId
 * @returns {{id: string, label: string, component: React.ComponentType}|undefined}
 */
export function getSpaceIconData(iconId) {
  return spaceIcons.find((s) => s.id === iconId);
}
