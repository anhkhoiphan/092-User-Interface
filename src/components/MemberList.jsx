import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { members, dmUsers, rooms } from "../data/mockData";
import {
  DMProfile,
  MemberSection,
  RecentFiles,
  UserProfilePopup,
} from "./memberlist/index.js";
import { CreateSpaceTips } from "./createspace/index.js";
import { SettingsShortcuts } from "./settings/index.js";
import {
  setMemberSearchQuery,
  setSelectedMember,
  clearSelectedMember,
} from "../store/slices/memberSlice";

function MemberList({ activeView, activeRoom }) {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const { memberSearchQuery, selectedMember } = useSelector(
    (state) => state.member,
  );
  const { selectedDMUser } = useSelector((state) => state.chat);
  const appState = useSelector((state) => state.app);

  const view = activeView || appState.activeView;
  const room = activeRoom || appState.activeRoom;

  const [dmUser, setDmUser] = useState(null);

  const allRoomIds = Object.values(rooms).flat().map((r) => r.id);
  const isBotRoom = room === "tro-ly-ai";
  const isDM = (view === "messages") || (room && !allRoomIds.includes(room) && !isBotRoom);

  // Build dmUser from selectedDMUser or fallback
  useEffect(() => {
    if (!isDM) {
      setDmUser(null);
      return;
    }

    if (!room) {
      setDmUser(null);
      return;
    }

    if (selectedDMUser && (selectedDMUser.id === room || selectedDMUser.userId === room)) {
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
    } else {
      // Fallback to mock data or basic user
      const mockUser = dmUsers.find((dm) => dm.id === room);
      if (mockUser) {
        setDmUser(mockUser);
      } else {
        setDmUser({
          id: room,
          name: room,
          avatar: null,
          color: null,
          isOnline: false,
          isFriend: false,
          email: "",
          bio: "",
          isBot: false,
        });
      }
    }
  }, [room, isDM, selectedDMUser]);

  // CreateSpace view
  if (view === "createSpace") {
    return <CreateSpaceTips isDark={isDark} />;
  }

  // Settings view
  if (view === "settings") {
    return <SettingsShortcuts isDark={isDark} />;
  }

  // DM view
  if (isDM) {
    return <DMProfile isDark={isDark} dmUser={dmUser} />;
  }

  // Normal member list view
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()),
  );
  const onlineMembers = filteredMembers.filter((m) => m.isOnline);
  const offlineMembers = filteredMembers.filter((m) => !m.isOnline);

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
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Thành viên
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
      </div>
      <RecentFiles isDark={isDark} />
    </div>
  );
}

export default MemberList;
