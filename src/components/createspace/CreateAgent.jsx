import { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
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
  FiX,
  FiUpload,
  FiFileText,
  FiTrash2,
  FiGlobe,
  FiLock,
  FiCheck,
  FiArrowLeft,
} from "react-icons/fi";
import { cancelCreateSpace } from "../../store/slices/appSlice";
import { dmService } from "../../services/dm.service";
import { usernameColors } from "../../constants/usernameColors";

const agentIcons = [
  { id: "robot", icon: PiRobot, label: "Robot" },
  { id: "brain", icon: PiBrain, label: "Trí tuệ" },
  { id: "graduation", icon: PiGraduationCap, label: "Học tập" },
  { id: "code", icon: PiCode, label: "Lập trình" },
  { id: "flask", icon: PiFlask, label: "Thí nghiệm" },
  { id: "book", icon: PiBook, label: "Sách" },
  { id: "star", icon: PiStar, label: "Ngôi sao" },
  { id: "rocket", icon: PiRocket, label: "Tên lửa" },
  { id: "lightning", icon: PiLightning, label: "Tia sét" },
  { id: "sparkle", icon: PiSparkle, label: "Lấp lánh" },
  { id: "globe", icon: PiGlobe, label: "Thế giới" },
  { id: "heart", icon: PiHeart, label: "Yêu thích" },
  { id: "shield", icon: PiShield, label: "Bảo vệ" },
  { id: "wrench", icon: PiWrench, label: "Công cụ" },
  { id: "search", icon: PiMagnifyingGlass, label: "Tìm kiếm" },
  { id: "chart", icon: PiChartLine, label: "Phân tích" },
  { id: "pen", icon: PiPenNib, label: "Sáng tạo" },
  { id: "music", icon: PiMusicNotes, label: "Âm nhạc" },
  { id: "camera", icon: PiCamera, label: "Hình ảnh" },
  { id: "game", icon: PiGameController, label: "Game" },
  { id: "pencil", icon: PiPencil, label: "Viết lách" },
];



const availableTools = [
  { id: "web_search", label: "Tìm kiếm web", desc: "Tìm kiếm thông tin trên internet" },
  { id: "calculator", label: "Máy tính", desc: "Thực hiện phép tính toán học" },
  { id: "code_interpreter", label: "Chạy code", desc: "Thực thi và kiểm tra code" },
  { id: "image_gen", label: "Tạo ảnh", desc: "Tạo hình ảnh từ mô tả" },
  { id: "pdf_reader", label: "Đọc PDF", desc: "Trích xuất nội dung từ file PDF" },
  { id: "translator", label: "Dịch thuật", desc: "Dịch ngôn ngữ đa ngôn ngữ" },
];

function CreateAgent({ editMode = false, initialData = null, onCancel }) {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const fileInputRef = useRef(null);

  const [agentName, setAgentName] = useState(initialData?.name || "");
  const [agentDescription, setAgentDescription] = useState(initialData?.description || "");
  const [agentIcon, setAgentIcon] = useState(initialData?.icon || agentIcons[0].id);
  const [agentColor, setAgentColor] = useState(initialData?.color || usernameColors[0].value);
  const [systemPrompt, setSystemPrompt] = useState(initialData?.systemPrompt || "");
  const [selectedTools, setSelectedTools] = useState(initialData?.tools || []);
  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [visibility, setVisibility] = useState(initialData?.visibility || "public");

  // Members state (giống tạo space)
  const [members, setMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleMemberSearch = async (query) => {
    setMemberSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
  };

  const handleMemberSearchKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = memberSearchQuery.trim();
      if (!query) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { data } = await dmService.searchUsers(query);
        const users = (data.users || []).map((user) => ({
          id: user.id,
          name: user.display_name || user.email || "Unknown",
          avatar: user.avatar_url || null,
          email: user.email || "",
        }));
        setSearchResults(users);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const addMember = (user) => {
    if (!members.some((m) => m.id === user.id)) {
      setMembers([...members, user]);
    }
  };

  const removeMember = (userId) => {
    setMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const toggleTool = (toolId) => {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    );
  };

  const filteredTools = availableTools.filter(
    (tool) =>
      tool.label.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(toolSearchQuery.toLowerCase())
  );

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = () => {
    if (agentName.trim()) {
      const agentData = {
        id: editMode && initialData ? initialData.id : agentName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        name: agentName.trim(),
        description: agentDescription.trim(),
        icon: agentIcon,
        color: agentColor.trim(),
        systemPrompt: systemPrompt.trim(),
        tools: selectedTools,
        files: uploadedFiles.map((f) => f.name),
        visibility,
        members: members.map((m) => m.id),
      };
      console.log(editMode ? "Updating agent:" : "Creating agent:", agentData);
      if (editMode && onCancel) {
        onCancel();
      } else {
        dispatch(cancelCreateSpace());
      }
    }
  };

  const selectedIconData = agentIcons.find((s) => s.id === agentIcon);
  const SelectedIcon = selectedIconData?.icon || PiRobot;
  const selectedColorHex = usernameColors.find((c) => c.value === agentColor)?.hex || usernameColors[0].hex;

  return (
    <div
      className="flex-1 flex flex-col min-w-0"
      style={{ background: "var(--bg-surface)" }}
    >
      <div
        className="px-4 py-3 border-b flex-shrink-0 flex items-center gap-3"
        style={{
          borderColor: "var(--border-primary)",
          background: "var(--bg-surface-secondary)",
        }}
      >
        {editMode && (
          <button
            onClick={() => {
              if (onCancel) onCancel();
            }}
            className="p-1.5 rounded-md hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
            title="Quay lại"
          >
            <FiArrowLeft size={18} />
          </button>
        )}
        <div>
          <div
            className="text-[15px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {editMode ? "Chỉnh sửa Agent" : "Tạo Agent mới"}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {editMode ? "Cập nhật thông tin agent" : "Tạo trợ lý AI tùy chỉnh"}
          </div>
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
              {agentIcons.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setAgentIcon(id)}
                  className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background:
                      agentIcon === id
                        ? "var(--primary)"
                        : "var(--card-bg-secondary)",
                    color:
                      agentIcon === id
                        ? isDark
                          ? "var(--bg-surface)"
                          : "#fff"
                        : "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (agentIcon !== id)
                      e.currentTarget.style.background = "var(--hover-primary)";
                  }}
                  onMouseLeave={(e) => {
                    if (agentIcon !== id)
                      e.currentTarget.style.background =
                        "var(--card-bg-secondary)";
                  }}
                >
                  <Icon size={24} />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Chọn màu
            </h3>
            <div className="flex flex-wrap gap-2">
              {usernameColors.map((color) => (
                <button
                  key={`${color.value}-${agentColor}`}
                  onClick={() => setAgentColor(color.value)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all"
                  style={{
                    background: color.hex,
                    borderColor:
                      agentColor === color.value
                        ? "#fff"
                        : "transparent",
                    boxShadow:
                      agentColor === color.value
                        ? "0 0 0 2px var(--primary)"
                        : "none",
                    transform:
                      agentColor === color.value ? "scale(1.15)" : "scale(1)",
                  }}
                  title={color.name}
                >
                  {agentColor === color.value && (
                    <span
                      style={{
                        color: "#fff",
                        fontSize: "14px",
                        textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
            {agentColor && (
              <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Màu hiện tại:{" "}
                <span
                  style={{
                    color: usernameColors.find((c) => c.value === agentColor)?.hex || agentColor,
                    fontWeight: "600",
                  }}
                >
                  {usernameColors.find((c) => c.value === agentColor)?.name || agentColor}
                </span>
              </div>
            )}
          </div>

          {/* Agent Name */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Tên Agent
            </h3>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="VD: Trợ lý Toán học, Code Reviewer..."
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
              Mô tả
            </h3>
            <textarea
              value={agentDescription}
              onChange={(e) => setAgentDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về agent này..."
              rows={2}
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

          {/* System Prompt */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              System Prompt (tùy chọn)
            </h3>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Mô tả hành vi, vai trò và kiến thức chuyên môn của agent..."
              rows={4}
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

          {/* Tools Selection */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Công cụ (Tools)
            </h3>
            {/* Tool search */}
            <div className="relative mb-3">
              <FiSearch
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                value={toolSearchQuery}
                onChange={(e) => setToolSearchQuery(e.target.value)}
                placeholder="Tìm công cụ..."
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
            <div className="space-y-2">
              {filteredTools.map((tool) => {
                const isSelected = selectedTools.includes(tool.id);
                return (
                  <label
                    key={tool.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{
                      background: isSelected
                        ? "var(--primary-active)"
                        : "var(--card-bg-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = "var(--hover-primary)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background =
                          "var(--card-bg-secondary)";
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTool(tool.id)}
                      className="w-4 h-4 cursor-pointer flex-shrink-0"
                      style={{ accentColor: "var(--primary)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {tool.label}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {tool.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
              {filteredTools.length === 0 && (
                <div
                  className="text-sm text-center py-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Không tìm thấy công cụ nào
                </div>
              )}
            </div>
          </div>

          {/* PDF Upload */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Tài liệu kiến thức (PDF)
            </h3>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
              style={{
                borderColor: "var(--input-border)",
                background: "var(--card-bg-secondary)",
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--input-border)";
              }}
            >
              <FiUpload
                size={28}
                className="mx-auto mb-2"
                style={{ color: "var(--text-secondary)" }}
              />
              <div
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Nhấn để tải lên PDF
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Hoặc kéo thả file vào đây
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ background: "var(--card-bg-secondary)" }}
                  >
                    <FiFileText
                      size={18}
                      style={{ color: "var(--primary)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {file.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 rounded hover:opacity-70 transition-opacity"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Quyền truy cập
            </h3>
            <div className="space-y-2">
              <label
                className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors"
                style={{
                  background:
                    visibility === "public"
                      ? "var(--primary-active)"
                      : "var(--card-bg-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (visibility !== "public")
                    e.currentTarget.style.background = "var(--hover-primary)";
                }}
                onMouseLeave={(e) => {
                  if (visibility !== "public")
                    e.currentTarget.style.background =
                      "var(--card-bg-secondary)";
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      visibility === "public"
                        ? "var(--primary)"
                        : "var(--bg-surface)",
                    color:
                      visibility === "public"
                        ? "#fff"
                        : "var(--text-secondary)",
                  }}
                >
                  <FiGlobe size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Công khai
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Mọi người trong workspace đều có thể sử dụng agent này
                  </div>
                </div>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: "var(--primary)" }}
                />
              </label>

              <label
                className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors"
                style={{
                  background:
                    visibility === "private"
                      ? "var(--primary-active)"
                      : "var(--card-bg-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (visibility !== "private")
                    e.currentTarget.style.background = "var(--hover-primary)";
                }}
                onMouseLeave={(e) => {
                  if (visibility !== "private")
                    e.currentTarget.style.background =
                      "var(--card-bg-secondary)";
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      visibility === "private"
                        ? "var(--primary)"
                        : "var(--bg-surface)",
                    color:
                      visibility === "private"
                        ? "#fff"
                        : "var(--text-secondary)",
                  }}
                >
                  <FiLock size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Riêng tư
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Chỉ bạn và người được thêm mới có thể sử dụng agent này
                  </div>
                </div>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: "var(--primary)" }}
                />
              </label>
            </div>
          </div>

          {/* Members - chỉ hiện khi chọn Private */}
          {visibility === "private" && (
            <div>
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Thêm người dùng
              </h3>
              <div className="relative mb-3">
                {isSearching ? (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <div
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{
                        borderColor: "var(--text-muted)",
                        borderTopColor: "transparent",
                      }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      handleMemberSearchKeyDown({
                        key: "Enter",
                        preventDefault: () => {},
                      })
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <FiSearch size={16} />
                  </button>
                )}
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => handleMemberSearch(e.target.value)}
                  onKeyDown={handleMemberSearchKeyDown}
                  placeholder="Nhập tên và nhấn Enter để tìm..."
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

              {members.length > 0 && (
                <div className="mb-3">
                  <div
                    className="text-xs font-medium mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Đã chọn ({members.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                        style={{
                          background: "var(--primary-active)",
                          color: "var(--primary)",
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold"
                          style={{
                            background: "var(--primary)",
                            color: "#fff",
                          }}
                        >
                          {member.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium">{member.name}</span>
                        <button
                          onClick={() => removeMember(member.id)}
                          className="ml-1 hover:opacity-70"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div>
                  <div
                    className="text-xs font-medium mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Kết quả tìm kiếm
                  </div>
                  <div className="space-y-1">
                    {searchResults.map((user) => {
                      const isSelected = members.some((m) => m.id === user.id);
                      return (
                        <label
                          key={user.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors hover:opacity-80"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                            style={{
                              background: "var(--primary-active)",
                              color: "var(--primary)",
                            }}
                          >
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-sm font-medium truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {user.name}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                removeMember(user.id);
                              } else {
                                addMember(user);
                              }
                            }}
                            className="w-4 h-4 cursor-pointer"
                            style={{ accentColor: "var(--primary)" }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {agentName && (
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
                    color="#fff"
                  />
                </div>
                <div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {agentName}
                  </div>
                  {agentDescription && (
                    <div
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {agentDescription.length > 60
                        ? agentDescription.slice(0, 60) + "..."
                        : agentDescription}
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
          onClick={() => {
            if (editMode && onCancel) {
              onCancel();
            } else {
              dispatch(cancelCreateSpace());
            }
          }}
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
          disabled={!agentName.trim()}
          className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "var(--primary)",
            color: isDark ? "var(--bg-surface)" : "#fff",
          }}
          onMouseEnter={(e) => {
            if (agentName.trim())
              e.currentTarget.style.background = "var(--primary-hover)";
          }}
          onMouseLeave={(e) => {
            if (agentName.trim())
              e.currentTarget.style.background = "var(--primary)";
          }}
        >
          {editMode ? "Lưu thay đổi" : "Tạo Agent"}
        </button>
      </div>
    </div>
  );
}

export default CreateAgent;
