import { useState } from "react";
import { useSelector } from "react-redux";
import { FiHash, FiAlignLeft, FiLock, FiGlobe, FiX, FiArrowLeft } from "react-icons/fi";

function CreateRoomView({ onCancel, onCreate }) {
  const { isDark } = useSelector((state) => state.theme);
  const [roomName, setRoomName] = useState("");
  const [roomTopic, setRoomTopic] = useState("");
  const [roomType, setRoomType] = useState("public");
  const [nameError, setNameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedName = roomName.trim();
    if (!trimmedName) {
      setNameError("Vui lòng nhập tên room");
      return;
    }
    if (trimmedName.length < 2) {
      setNameError("Tên room phải có ít nhất 2 ký tự");
      return;
    }
    setNameError("");
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    onCreate({
      name: trimmedName,
      displayName: trimmedName,
      topic: roomTopic.trim(),
      type: roomType,
    });

    setIsSubmitting(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className="flex-1 flex flex-col min-w-0"
      style={{ background: "var(--bg-surface)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b shrink-0 flex items-center gap-3"
        style={{
          borderColor: "var(--border-primary)",
          background: "var(--bg-surface-secondary)",
        }}
      >
        <button
          onClick={onCancel}
          className="p-1.5 rounded-md hover:opacity-70 transition-opacity cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
          title="Quay lại"
        >
          <FiArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="text-[15px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Tạo room mới
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Thêm kênh thảo luận mới vào space
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Room Info Card */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Thông tin room
            </h3>
            <div
              className="p-4 rounded-lg space-y-4"
              style={{ background: "var(--card-bg-secondary)" }}
            >
              {/* Room Name */}
              <div>
                <label
                  className="text-xs font-medium mb-1 block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Tên room <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <div className="relative">
                  <FiHash
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => {
                      setRoomName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="ví-dụ: thao-luan-chung"
                    className="w-full pl-9 pr-3 py-2 rounded-md text-sm border outline-none"
                    style={{
                      background: "var(--input-bg)",
                      borderColor: nameError
                        ? "var(--danger)"
                        : "var(--input-border)",
                      color: "var(--input-text)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = nameError
                        ? "var(--danger)"
                        : "var(--input-border)")
                    }
                    autoFocus
                  />
                </div>
                {nameError && (
                  <div
                    className="text-xs mt-1"
                    style={{ color: "var(--danger)" }}
                  >
                    {nameError}
                  </div>
                )}
              </div>

              {/* Room Topic */}
              <div>
                <label
                  className="text-xs font-medium mb-1 block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Chủ đề{" "}
                  <span style={{ color: "var(--text-muted)" }}>(tùy chọn)</span>
                </label>
                <div className="relative">
                  <FiAlignLeft
                    size={16}
                    className="absolute left-3 top-2.5"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    type="text"
                    value={roomTopic}
                    onChange={(e) => setRoomTopic(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Mô tả ngắn về nội dung thảo luận..."
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
              </div>
            </div>
          </div>

          {/* Room Type Card */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Quyền riêng tư
            </h3>
            <div className="space-y-2">
              {/* Public option */}
              <button
                onClick={() => setRoomType("public")}
                className="w-full p-4 rounded-lg flex items-start gap-3 text-left cursor-pointer transition-colors border"
                style={{
                  background:
                    roomType === "public"
                      ? "var(--primary-active)"
                      : "var(--card-bg-secondary)",
                  borderColor:
                    roomType === "public"
                      ? "var(--primary)"
                      : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (roomType !== "public") {
                    e.currentTarget.style.background = "var(--hover-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (roomType !== "public") {
                    e.currentTarget.style.background = "var(--card-bg-secondary)";
                  }
                }}
              >
                <div
                  className="mt-0.5 flex-shrink-0"
                  style={{
                    color:
                      roomType === "public"
                        ? "var(--primary)"
                        : "var(--text-muted)",
                  }}
                >
                  <FiGlobe size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium"
                    style={{
                      color:
                        roomType === "public"
                          ? "var(--primary)"
                          : "var(--text-primary)",
                    }}
                  >
                    Công khai
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Mọi thành viên trong space đều có thể tham gia và xem tin
                    nhắn
                  </div>
                </div>
                <div
                  className="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    borderColor:
                      roomType === "public"
                        ? "var(--primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {roomType === "public" && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: "var(--primary)" }}
                    />
                  )}
                </div>
              </button>

              {/* Private option */}
              <button
                onClick={() => setRoomType("private")}
                className="w-full p-4 rounded-lg flex items-start gap-3 text-left cursor-pointer transition-colors border"
                style={{
                  background:
                    roomType === "private"
                      ? "var(--primary-active)"
                      : "var(--card-bg-secondary)",
                  borderColor:
                    roomType === "private"
                      ? "var(--primary)"
                      : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (roomType !== "private") {
                    e.currentTarget.style.background = "var(--hover-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (roomType !== "private") {
                    e.currentTarget.style.background = "var(--card-bg-secondary)";
                  }
                }}
              >
                <div
                  className="mt-0.5 flex-shrink-0"
                  style={{
                    color:
                      roomType === "private"
                        ? "var(--primary)"
                        : "var(--text-muted)",
                  }}
                >
                  <FiLock size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium"
                    style={{
                      color:
                        roomType === "private"
                          ? "var(--primary)"
                          : "var(--text-primary)",
                    }}
                  >
                    Riêng tư
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Chỉ thành viên được mời mới có thể tham gia và xem tin nhắn
                  </div>
                </div>
                <div
                  className="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    borderColor:
                      roomType === "private"
                        ? "var(--primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {roomType === "private" && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: "var(--primary)" }}
                    />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-6 py-4 border-t flex justify-end gap-3"
        style={{
          borderColor: "var(--border-primary)",
          background: "var(--bg-surface-secondary)",
        }}
      >
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
          style={{
            background: "transparent",
            color: "var(--text-primary)",
            border: "1px solid var(--border-primary)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--hover-primary)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
          style={{
            background: isSubmitting ? "var(--text-muted)" : "var(--primary)",
            color: isDark ? "var(--bg-surface)" : "#fff",
            opacity: isSubmitting ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting)
              e.currentTarget.style.background = "var(--primary-hover)";
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting)
              e.currentTarget.style.background = "var(--primary)";
          }}
        >
          {isSubmitting ? "Đang tạo..." : "Tạo room"}
        </button>
      </div>
    </div>
  );
}

export default CreateRoomView;
