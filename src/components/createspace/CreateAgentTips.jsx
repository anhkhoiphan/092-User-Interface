import { FiZap, FiTool, FiBook, FiShield } from "react-icons/fi";

function CreateAgentTips({ isDark }) {
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
            Mẹo tạo Agent
          </div>
          <ul
            className="text-xs space-y-3"
            style={{ color: "var(--text-secondary)" }}
          >
            <li className="flex items-start gap-2">
              <FiZap size={14} className="mt-0.5 flex-shrink-0" />
              <span>Đặt tên ngắn gọn, dễ nhớ để dễ tìm kiếm sau này</span>
            </li>
            <li className="flex items-start gap-2">
              <FiBook size={14} className="mt-0.5 flex-shrink-0" />
              <span>System Prompt càng chi tiết, agent càng đúng vai trò</span>
            </li>
            <li className="flex items-start gap-2">
              <FiTool size={14} className="mt-0.5 flex-shrink-0" />
              <span>Chọn đúng công cụ để agent có thể thực hiện nhiều tác vụ</span>
            </li>
            <li className="flex items-start gap-2">
              <FiShield size={14} className="mt-0.5 flex-shrink-0" />
              <span>Tải tài liệu PDF để agent có kiến thức chuyên ngành</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CreateAgentTips;
