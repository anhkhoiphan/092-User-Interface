import { useState } from "react";
import { useSelector } from "react-redux";
import {
  PiRobot,
  PiBrain,
  PiGraduationCap,
  PiCode,
  PiFlask,
  PiBook,
  PiStar,
  PiRocket,
  PiLightning,
  PiSparkle,
  PiGlobe,
  PiHeart,
  PiShield,
  PiWrench,
  PiMagnifyingGlass,
  PiChartLine,
  PiPenNib,
  PiMusicNotes,
  PiCamera,
  PiGameController,
  PiPencil,
} from "react-icons/pi";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiGlobe as FiGlobeIcon,
  FiLock,
} from "react-icons/fi";

const iconMap = {
  robot: PiRobot,
  brain: PiBrain,
  graduation: PiGraduationCap,
  code: PiCode,
  flask: PiFlask,
  book: PiBook,
  star: PiStar,
  rocket: PiRocket,
  lightning: PiLightning,
  sparkle: PiSparkle,
  globe: PiGlobe,
  heart: PiHeart,
  shield: PiShield,
  wrench: PiWrench,
  search: PiMagnifyingGlass,
  chart: PiChartLine,
  pen: PiPenNib,
  music: PiMusicNotes,
  camera: PiCamera,
  game: PiGameController,
  pencil: PiPencil,
};

// Mock data - sau này sẽ thay bằng API call
const mockAgents = [
  {
    id: "math-tutor",
    name: "Trợ lý Toán học",
    icon: "graduation",
    color: "#6366f1",
    description: "Giải thích các bài toán từ cơ bản đến nâng cao",
    visibility: "public",
    tools: ["calculator", "web_search"],
    createdAt: "2026-04-15",
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    icon: "code",
    color: "#10b981",
    description: "Review code và gợi ý cải thiện",
    visibility: "private",
    tools: ["code_interpreter"],
    createdAt: "2026-04-18",
  },
  {
    id: "translator-bot",
    name: "Dịch thuật AI",
    icon: "globe",
    color: "#3b82f6",
    description: "Dịch đa ngôn ngữ chính xác cao",
    visibility: "public",
    tools: ["translator", "web_search"],
    createdAt: "2026-04-20",
  },
];

function ManageAgent({ onEditAgent }) {
  const { isDark } = useSelector((state) => state.theme);
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState(mockAgents);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (agentId, e) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa agent này?")) {
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
    }
  };

  const toggleVisibility = (agentId, e) => {
    e.stopPropagation();
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, visibility: a.visibility === "public" ? "private" : "public" }
          : a
      )
    );
  };

  const handleEdit = (agent, e) => {
    e.stopPropagation();
    if (onEditAgent) {
      onEditAgent(agent);
    }
  };

  const getAgentIcon = (iconId) => {
    const IconComponent = iconMap[iconId];
    return IconComponent || PiRobot;
  };

  return (
    <div
      className="flex-1 flex flex-col min-w-0"
      style={{ background: "var(--bg-surface)" }}
    >
      {/* Header */}
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
          Quản lý Agent
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Xem và quản lý các agent đã tạo
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Search */}
          <div className="relative">
            <FiSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm agent..."
              className="w-full pl-9 pr-3 py-2 rounded-md text-sm border outline-none"
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

          {/* Agent count */}
          <div
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {filteredAgents.length} agent
          </div>

          {/* Agent list */}
          <div className="space-y-3">
            {filteredAgents.map((agent) => {
              const AgentIcon = getAgentIcon(agent.icon);
              return (
                <div
                  key={agent.id}
                  className="p-4 rounded-lg cursor-pointer group"
                  style={{ background: "var(--card-bg-secondary)" }}
                  onClick={(e) => handleEdit(agent, e)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--hover-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--card-bg-secondary)";
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: agent.color }}
                    >
                      <AgentIcon size={22} color="#fff" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {agent.name}
                        </div>
                        {agent.visibility === "public" ? (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                            style={{
                              background: "var(--primary-active)",
                              color: "var(--primary)",
                            }}
                          >
                            <FiGlobeIcon size={10} />
                            Công khai
                          </span>
                        ) : (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                            style={{
                              background: "var(--hover-primary)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <FiLock size={10} />
                            Riêng tư
                          </span>
                        )}
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {agent.description}
                      </div>
                      <div
                        className="text-xs mt-2 flex items-center gap-3"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span>{agent.tools.length} công cụ</span>
                        <span>•</span>
                        <span>Tạo ngày {agent.createdAt}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEdit(agent, e)}
                        className="p-1.5 rounded hover:opacity-70 transition-opacity"
                        style={{ color: "var(--text-secondary)" }}
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => toggleVisibility(agent.id, e)}
                        className="p-1.5 rounded hover:opacity-70 transition-opacity"
                        style={{ color: "var(--text-secondary)" }}
                        title={
                          agent.visibility === "public"
                            ? "Đổi thành riêng tư"
                            : "Đổi thành công khai"
                        }
                      >
                        {agent.visibility === "public" ? (
                          <FiLock size={16} />
                        ) : (
                          <FiGlobeIcon size={16} />
                        )}
                      </button>
                      <button
                        onClick={(e) => handleDelete(agent.id, e)}
                        className="p-1.5 rounded hover:opacity-70 transition-opacity"
                        style={{ color: "var(--danger)" }}
                        title="Xóa"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAgents.length === 0 && (
              <div
                className="text-center py-12 rounded-lg"
                style={{ background: "var(--card-bg-secondary)" }}
              >
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Không tìm thấy agent nào
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Thử tìm kiếm với từ khóa khác
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageAgent;
