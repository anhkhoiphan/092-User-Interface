import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./App.css";
import Sidebar from "./components/Sidebar";
import RoomList from "./components/RoomList";
import ChatArea from "./components/ChatArea";
import MemberList from "./components/MemberList";
import CreateSpace from "./components/createspace/CreateSpace";
import LoginPage from "./pages/LoginPage";
import { initializeAuth } from "./store/slices/authSlice";

function App() {
  const dispatch = useDispatch();
  const { activeView, activeSpace, activeRoom, searchQuery, isSettings } =
    useSelector((state) => state.app);
  const { isAuthenticated, initialized, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
    if (!initialized && !loading) {
      dispatch(initializeAuth());
    }
  }, [dispatch, initialized, loading]);

  const currentView = isSettings ? "settings" : activeView;

  if (!initialized) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-linear-to-br from-white via-indigo-100 to-blue-200">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="w-screen h-screen flex overflow-hidden">
      <Sidebar />
      {currentView === "createSpace" ? (
        <>
          <RoomList activeView="createSpace" />
          <CreateSpace />
          <MemberList activeView="createSpace" />
        </>
      ) : (
        <>
          <RoomList
            activeView={currentView}
            activeSpace={activeSpace}
            activeRoom={activeRoom}
            searchQuery={searchQuery}
          />
          <ChatArea activeView={currentView} activeRoom={activeRoom} />
          <MemberList activeView={currentView} activeRoom={activeRoom} />
        </>
      )}
    </div>
  );
}

export default App;
