import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { PiGraduationCap } from "react-icons/pi";
import { FiSearch, FiX } from "react-icons/fi";
import {
  cancelCreateSpace,
  navigateToSpace,
} from "../../store/slices/appSlice";
import { createSpace } from "../../store/slices/spaceSlice";
import { dmService } from "../../services/dm.service";
import { spaceIcons, getSpaceIconComponent } from "../../constants/spaceIcons";

function CreateSpace() {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const [spaceName, setSpaceName] = useState("");
  const [spaceIcon, setSpaceIcon] = useState(spaceIcons[0].id);
  const [spaceDescription, setSpaceDescription] = useState("");

  // Members state
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useState(null);

  // Search users - only trigger on Enter key
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
  };

  const handleSearchKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchQuery.trim();

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

  // Add member
  const addMember = (user) => {
    if (!members.some((m) => m.id === user.id)) {
      setMembers([...members, user]);
    }
  };

  // Remove member
  const removeMember = (userId) => {
    setMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const [createError, setCreateError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async () => {
    if (!spaceName.trim() || isCreating) return;

    setCreateError(null);
    setIsCreating(true);

    try {
      const payload = {
        name: spaceName.trim(),
        isPrivate: false,
      };
      if (spaceDescription.trim()) {
        payload.description = spaceDescription.trim();
      }
      // Gửi icon id (theo spaceIcons id) lên BE
      payload.icon = spaceIcon;

      // Gửi memberIds nếu có members được chọn
      if (members.length > 0) {
        payload.memberIds = members.map((m) => m.id);
      }

      const result = await dispatch(createSpace(payload)).unwrap();

      // If members were selected, add them to the space
      if (members.length > 0 && result?.id) {
        console.log("Space created, members to add:", members);
      }

      // Navigate to the newly created space
      if (result?.id) {
        dispatch(navigateToSpace(result.id));
      }
    } catch (err) {
      console.error("Failed to create space:", err);
      setCreateError(
        typeof err === "string"
          ? err
          : err?.message || "Không thể tạo space. Vui lòng thử lại.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const selectedIconData = spaceIcons.find((s) => s.id === spaceIcon);
  const SelectedIcon = selectedIconData?.component || PiGraduationCap;

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
              {spaceIcons.map(({ id, component: IconComponent }) => (
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
                  <IconComponent size={24} />
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

          {/* Members */}
          <div>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Thêm thành viên
            </h3>

            {/* Search input */}
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
                    handleSearchKeyDown({
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
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
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

            {/* Selected members - chips */}
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

            {/* Search results with checkbox - keep showing after select */}
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
                          style={{
                            accentColor: "var(--primary)",
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
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
      {/* Error message */}
      {createError && (
        <div
          className="px-6 py-3 border-t"
          style={{
            borderColor: "var(--border-primary)",
            background: "rgba(239, 68, 68, 0.1)",
          }}
        >
          <div className="text-sm" style={{ color: "#ef4444" }}>
            {createError}
          </div>
        </div>
      )}
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
          disabled={!spaceName.trim() || isCreating}
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
          {isCreating ? "Đang tạo..." : "Tạo Space"}
        </button>
      </div>
    </div>
  );
}

export default CreateSpace;
