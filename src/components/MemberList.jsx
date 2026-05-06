import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  DMProfile,
  MemberSection,
  RecentFiles,
  UserProfilePopup,
} from "./memberlist/index.js";
import { FiUserPlus } from "react-icons/fi";
import { CreateSpaceTips, CreateAgentTips } from "./createspace/index.js";
import { SettingsShortcuts } from "./settings/index.js";
import {
  setMemberSearchQuery,
  setSelectedMember,
  clearSelectedMember,
} from "../store/slices/memberSlice";
import { fetchSpaceMembers } from "../store/slices/spaceSlice";


function MemberList({ activeView, activeRoom, createTab }) {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const { memberSearchQuery, selectedMember } = useSelector(
    (state) => state.member,
  );
  const { selectedDMUser } = useSelector((state) => state.chat);
  const { activeConversation } = useSelector((state) => state.dm);
  const { spaces, membersMap, membersLoading, fetchedMembers } = useSelector(
    (state) => state.space,
  );
  const appState = useSelector((state) => state.app);

  const view = activeView || appState.activeView;
  const room = activeRoom || appState.activeRoom;
  const activeSpace = appState.activeSpace;

  const [dmUser, setDmUser] = useState(null);

  // Detect if current room is a space room
  const { roomsMap } = useSelector((state) => state.space);
  const isSpaceRoom = room && Object.values(roomsMap).some(
    (rooms) => rooms.some((r) => r.id === room)
  );
  const isBotRoom = room === "tro-ly-ai";
  const isDM = view === "messages" || (room && !isSpaceRoom && !isBotRoom && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(room));

  // Build dmUser from activeConversation
  useEffect(() => {
    if (!isDM) {
      setDmUser(null);
      return;
    }
    if (!room) {
      setDmUser(null);
      return;
    }
    if (activeConversation?.other_user) {
      const ou = activeConversation.other_user;
      setDmUser({
        id: ou.id,
        name: ou.display_name || "Unknown",
        avatar: ou.avatar_url || null,
        color: ou.color || null,
        isOnline: ou.status === "online",
        isFriend: true,
        email: ou.email || "",
        bio: ou.bio || "",
        isBot: false,
      });
    } else if (selectedDMUser) {
      setDmUser({
        id: selectedDMUser.id || selectedDMUser.userId,
        name: selectedDMUser.name || "Unknown",
        avatar: selectedDMUser.avatar || null,
        color: selectedDMUser.color || null,
        isOnline: selectedDMUser.isOnline || false,
        isFriend: selectedDMUser.isFriend ?? true,
        email: selectedDMUser.email || "",
        bio: selectedDMUser.bio || "",
        isBot: selectedDMUser.isBot || false,
      });
    }
  }, [room, isDM, selectedDMUser, activeConversation]);

  // 🆕 Lazy load space members when entering a space room
  useEffect(() => {
    if (!activeSpace || isDM) return;
    const hasMembers = membersMap[activeSpace] && membersMap[activeSpace].length > 0;
    const isFetched = fetchedMembers[activeSpace];
    if (!hasMembers && !isFetched) {
      dispatch(fetchSpaceMembers(activeSpace));
    }
  }, [activeSpace, isDM, dispatch, membersMap, fetchedMembers]);

  // CreateSpace view
  if (view === "createSpace") {
    return createTab === "agent" ? <CreateAgentTips isDark={isDark} /> : <CreateSpaceTips isDark={isDark} />;
  }

  // Settings view
  if (view === "settings") {
    return <SettingsShortcuts isDark={isDark} />;
  }

  // DM view
  if (isDM) {
    return <DMProfile isDark={isDark} dmUser={dmUser} />;
  }

  // Space member list view — use real API data
  const spaceMembers = membersMap[activeSpace] || [];

  // Normalize API members to format MemberItem expects
  console.log("[MemberList] Raw spaceMembers:", spaceMembers);
  const normalizedMembers = spaceMembers.map((m) => {
    const displayName = m.displayName || m.display_name || m.username || m.email || "Unknown";
    const isOnline = m.status === "online";
    const avatarUrl = m.avatar || m.avatar_url;
    const normalized = {
      id: m.id || m.user_id,
      name: displayName,
      avatar: avatarUrl
        ? (avatarUrl.length <= 2 ? avatarUrl : displayName.charAt(0).toUpperCase())
        : displayName.charAt(0).toUpperCase(),
      color: m.color || null,
      isOnline,
      isFriend: true,
      isBot: false,
      email: m.email || "",
      role: m.role || "member",
    };
    console.log("[MemberList] Normalized member:", { original: m, normalized });
    return normalized;
  });
  console.log("[MemberList] Online:", normalizedMembers.filter((m) => m.isOnline).length, "Offline:", normalizedMembers.filter((m) => !m.isOnline).length);

  // Filter by search
  const filteredMembers = normalizedMembers.filter((m) =>
    m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()),
  );

  const onlineMembers = filteredMembers.filter((m) => m.isOnline);
  const offlineMembers = filteredMembers.filter((m) => !m.isOnline);

  // Get current space name
  const currentSpace = spaces.find((s) => s.id === activeSpace);

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
        <div className="flex items-center justify-between mb-3">
          <div
            className="text-sm font-semibold uppercase tracking-wider truncate"
            style={{ color: "var(--text-primary)" }}
          >
            Thành viên
          </div>
          <button
            onClick={() => console.log("Add member clicked")}
            className="p-1.5 rounded hover:opacity-70 transition-opacity cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            title="Thêm thành viên"
          >
            <FiUserPlus size={14} />
          </button>
        </div>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md text-sm outline-none transition-colors"
          style={{
            background: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--input-text)",
          }}
          placeholder="Tìm kiếm thành viên..."
          value={memberSearchQuery}
          onChange={(e) => dispatch(setMemberSearchQuery(e.target.value))}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3 relative">
        {/* User Profile Popup */}
        {selectedMember && (
          <UserProfilePopup
            user={selectedMember}
            isDark={isDark}
            onClose={() => dispatch(clearSelectedMember())}
            onSendMessage={(user) => {
              dispatch(clearSelectedMember());
            }}
          />
        )}

        {membersLoading && (
          <div className="flex flex-col gap-3 px-3 py-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div
                  className="w-9 h-9 rounded-lg flex-shrink-0"
                  style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div
                    className="h-3.5 w-24 rounded"
                    style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}
                  />
                  <div
                    className="h-2.5 w-16 rounded"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {!membersLoading && normalizedMembers.length === 0 && (
          <div className="text-center py-6 text-xs" style={{ color: "var(--text-muted)" }}>
            Chưa có thành viên nào
          </div>
        )}

        {!membersLoading && (
          <>
            <MemberSection
              isDark={isDark}
              title="Online"
              members={onlineMembers}
              onMemberClick={(member) => dispatch(setSelectedMember(member))}
            />
            <MemberSection
              isDark={isDark}
              title="Offline"
              members={offlineMembers}
              onMemberClick={(member) => dispatch(setSelectedMember(member))}
            />
          </>
        )}
      </div>
      <RecentFiles isDark={isDark} />
    </div>
  );
}

export default MemberList;
