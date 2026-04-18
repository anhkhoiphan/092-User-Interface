import { useSelector, useDispatch } from "react-redux";
import { spaces } from "../data/mockData";
import MessagesButton from "./sidebar/MessagesButton";
import SpaceIcon from "./sidebar/SpaceIcon";
import {
  navigateToSpace,
  navigateToMessages,
  openCreateSpace,
  openSettings,
  closeSettings,
} from "../store/slices/appSlice";
import { toggleTheme } from "../store/slices/themeSlice";

function Sidebar() {
  const dispatch = useDispatch();
  const { activeView, activeSpace, isSettings } = useSelector(
    (state) => state.app,
  );
  const { isDark } = useSelector((state) => state.theme);

  const currentView = isSettings ? "settings" : activeView;

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
        />
        {spaces.map((space) => (
          <SpaceIcon
            key={space.id}
            icon={space.icon}
            isActive={currentView === "space" && activeSpace === space.id}
            hasNotification={space.hasNotification}
            onClick={() => {
              dispatch(navigateToSpace(space.id));
            }}
            title={space.name}
          />
        ))}
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
