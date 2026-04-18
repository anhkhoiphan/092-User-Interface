import { useSelector, useDispatch } from "react-redux";
import CreateSpaceGuide from "./createspace/CreateSpaceGuide";
import SettingsMenu from "./settings/SettingsMenu";
import DMList from "./roomlist/DMList";
import SpaceRoomList from "./roomlist/SpaceRoomList";
import { setActiveRoom, setSearchQuery } from "../store/slices/appSlice";

function RoomList({ activeView, activeSpace, activeRoom, searchQuery }) {
  const dispatch = useDispatch();
  const appState = useSelector((state) => state.app);

  const view = activeView || appState.activeView;
  const space = activeSpace || appState.activeSpace;
  const room = activeRoom || appState.activeRoom;
  const query = searchQuery !== undefined ? searchQuery : appState.searchQuery;

  const handleSetActiveRoom = (roomId) => {
    dispatch(setActiveRoom(roomId));
  };

  const handleSetSearchQuery = (query) => {
    dispatch(setSearchQuery(query));
  };

  if (view === "createSpace") {
    return <CreateSpaceGuide />;
  }

  if (view === "settings") {
    return <SettingsMenu />;
  }

  if (view === "messages") {
    return (
      <DMList
        activeRoom={room}
        setActiveRoom={handleSetActiveRoom}
        searchQuery={query}
        setSearchQuery={handleSetSearchQuery}
        
      />
    );
  }

  return (
    <SpaceRoomList
      activeSpace={space}
      activeRoom={room}
      setActiveRoom={handleSetActiveRoom}
      searchQuery={query}
      setSearchQuery={handleSetSearchQuery}
    />
  );
}

export default RoomList;
