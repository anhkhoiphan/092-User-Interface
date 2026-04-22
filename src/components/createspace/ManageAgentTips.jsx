import { FiInfo, FiShield, FiZap } from "react-icons/fi";

function ManageAgentTips({ isDark }) {
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
          Thông tin
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
            Quản lý Agent
          </div>
          <ul
            className="text-xs space-y-3"
            style={{ color: "var(--text-secondary)" }}
          >
            <li className="flex items-start gap-2">
              <FiZap size={14} className="mt-0.5 flex-shrink-0" />
              <span>Click vào icon ⋮ để chỉnh sửa, đổi quyền hoặc xóa agent</span>
            </li>
            <li className="flex items-start gap-2">
              <FiShield size={14} className="mt-0.5 flex-shrink-0" />
              <span>Agent riêng tư chỉ bạn và ngườii được thêm mới dùng được</span>
            </li>
            <li className="flex items-start gap-2">
              <FiInfo size={14} className="mt-0.5 flex-shrink-0" />
              <span>Agent công khai mọi ngườii trong workspace đều có thể sử dụng</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ManageAgentTips;
