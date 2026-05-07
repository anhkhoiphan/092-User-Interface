import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import MessagesButton from "./sidebar/MessagesButton";
import SpaceIcon from "./sidebar/SpaceIcon";
import {
  navigateToSpace,
  navigateToMessages,
  openCreateSpace,
  openSettings,
  closeSettings,
} from "../store/slices/appSlice";


function Sidebar() {
  const dispatch = useDispatch();
  const appState = useSelector((state) => state.app);
  const { activeView, activeSpace, isSettings } = appState;
  const { isDark } = useSelector((state) => state.theme);
  const { totalUnreadCount } = useSelector((state) => state.dm);
  const { spaces, loading: spacesLoading, spacesFetched } = useSelector(
    (state) => state.space,
  );
  const { isAuthenticated } = useSelector((state) => state.auth);
  const currentView = isSettings ? "settings" : activeView;

  console.log("[Sidebar] Render - spaces count:", spaces.length, "spacesLoading:", spacesLoading, "spaces:", spaces.map(s => ({ id: s.id, name: s.name })));

  return (
    <div
      className="w-16 min-w-16 flex flex-col items-center py-3 px-0 gap-2"
      style={{ background: "var(--bg-surface)" }}
    >
      <div className="flex flex-col items-center gap-2 flex-1 pt-1">
        <MessagesButton
          isActive={currentView === "messages"}
          onClick={() => {
            dispatch(navigateToMessages());
          }}
          unreadCount={totalUnreadCount}
        />
        {spaces.map((space) => (
          <SpaceIcon
            key={space.id}
            icon={space.icon_url}
            name={space.name}
            isActive={currentView === "space" && activeSpace === space.id}
            hasNotification={space.hasNotification || false}
            onClick={() => {
              dispatch(navigateToSpace(space.id));
            }}
            title={space.name}
          />
        ))}
        {spacesLoading && (
          <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: "var(--hover-primary)" }} />
        )}
        <SpaceIcon
          icon="plus"
          isActive={currentView === "createSpace"}
          hasNotification={false}
          onClick={() => {
            dispatch(openCreateSpace());
          }}
          title="Tạo Space mới"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <SpaceIcon
          icon="settings"
          isActive={currentView === "settings"}
          hasNotification={false}
          onClick={() => dispatch(openSettings())}
          title="Settings"
        />
      </div>
    </div>
  );
}

export default Sidebar;
