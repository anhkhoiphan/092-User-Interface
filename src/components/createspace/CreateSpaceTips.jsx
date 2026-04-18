import { FiZap, FiEdit3, FiTarget } from "react-icons/fi";

function CreateSpaceTips({ isDark }) {
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
          Gợi ý
        </div>
      </div>
      <div className="flex-1 p-4">
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--card-bg-secondary)" }}
        >
          <div
            className="text-xs font-medium mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Mẹo tạo Space
          </div>
          <ul
            className="text-xs space-y-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <li className="flex items-center gap-2">
              <FiZap size={14} /> Đặt tên dễ nhớ
            </li>
            <li className="flex items-center gap-2">
              <FiEdit3 size={14} /> Thêm mô tả ngắn
            </li>
            <li className="flex items-center gap-2">
              <FiTarget size={14} /> Chọn icon phù hợp
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CreateSpaceTips;
