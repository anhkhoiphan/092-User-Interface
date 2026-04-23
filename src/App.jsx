import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./App.css";
import Sidebar from "./components/Sidebar";
import RoomList from "./components/RoomList";
import ChatArea from "./components/ChatArea";
import MemberList from "./components/MemberList";
import CreateSpace from "./components/createspace/CreateSpace";
import CreateAgent from "./components/createspace/CreateAgent";
import CreateSpaceTips from "./components/createspace/CreateSpaceTips";
import CreateAgentTips from "./components/createspace/CreateAgentTips";
import ManageAgent from "./components/createspace/ManageAgent";
import ManageAgentTips from "./components/createspace/ManageAgentTips";
import LoginPage from "./pages/LoginPage";
import { initializeAuth } from "./store/slices/authSlice";
import {
  addMessage as addDMMessage,
  markConversationAsFetched,
  updateConversationLastMessage,
} from "./store/slices/dmSlice";
import socketService from "./services/socket.service";

function App() {
  const dispatch = useDispatch();
  const { activeView, activeSpace, activeRoom, searchQuery, isSettings } =
    useSelector((state) => state.app);
  const { isAuthenticated, initialized, loading, isLoggingOut } = useSelector((state) => state.auth);

  const [createTab, setCreateTab] = useState("space");
  const [editingAgent, setEditingAgent] = useState(null);
  const [roomListCollapsed, setRoomListCollapsed] = useState(false);
  const [memberListCollapsed, setMemberListCollapsed] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);

  useEffect(() => {
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
    if (!initialized && !loading) {
      dispatch(initializeAuth());
    }
  }, [dispatch, initialized, loading]);

  // Connect WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  // Global WebSocket listener: always cache incoming DMs regardless of current view
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewDM = (data) => {
      if (!data?.id) return;

      const conversationId = data.conversation_id || data.conversationId;
      if (!conversationId) return;

      // Cache the message in Redux so it's available when user opens the conversation
      dispatch(
        addDMMessage({
          conversationId,
          message: {
            id: data.id,
            conversation_id: conversationId,
            sender_id: data.sender_id,
            content: data.content,
            is_read: data.is_read ?? false,
            created_at: data.created_at || data.timestamp,
            sender: data.sender,
          },
        })
      );

      // Note: We do NOT mark conversation as fetched here.
      // Only mark as fetched after a full API fetch (page 1) so that
      // opening a conversation for the first time still loads historical messages.
      // WebSocket messages are cached but the conversation is not "fully fetched" yet.

      // Update last message in conversation list
      dispatch(
        updateConversationLastMessage({
          conversationId,
          message: {
            id: data.id,
            content: data.content,
            created_at: data.created_at || data.timestamp,
          },
        })
      );
    };

    socketService.onNewDM(handleNewDM);

    return () => {
      socketService.off("newDM", handleNewDM);
    };
  }, [isAuthenticated, dispatch]);

  const currentView = isSettings ? "settings" : activeView;

  if (!initialized || isLoggingOut) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-linear-to-br from-white via-indigo-100 to-blue-200">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setCreateTab("editAgent");
  };

  const handleCancelEdit = () => {
    setEditingAgent(null);
    setCreateTab("manageAgent");
  };

  const renderCreateContent = () => {
    switch (createTab) {
      case "agent":
        return <CreateAgent />;
      case "manageAgent":
        return <ManageAgent onEditAgent={handleEditAgent} />;
      case "editAgent":
        return (
          <CreateAgent
            editMode
            initialData={editingAgent}
            onCancel={handleCancelEdit}
          />
        );
      default:
        return <CreateSpace />;
    }
  };

  const renderCreateTips = () => {
    switch (createTab) {
      case "agent":
        return <CreateAgentTips />;
      case "manageAgent":
        return <ManageAgentTips />;
      case "editAgent":
        return <CreateAgentTips />;
      default:
        return <CreateSpaceTips />;
    }
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden">
      <Sidebar />
      {currentView === "createSpace" ? (
        <>
          <RoomList activeView="createSpace" createTab={createTab} onCreateTabChange={setCreateTab} />
          {renderCreateContent()}
          {renderCreateTips()}
        </>
      ) : (
        <>
          <div
            className="flex-shrink-0 h-screen overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              width: roomListCollapsed ? 0 : 240,
              minWidth: roomListCollapsed ? 0 : 240,
              opacity: roomListCollapsed ? 0 : 1,
            }}
          >
            <RoomList
              activeView={currentView}
              activeSpace={activeSpace}
              activeRoom={activeRoom}
              searchQuery={searchQuery}
              onCreateRoomClick={() => setIsCreatingRoom(true)}
            />
          </div>

          {/* Collapsed room list indicator */}
          {roomListCollapsed && (
            <div
              className="flex-shrink-0 h-screen flex flex-col items-center justify-center cursor-pointer border-r transition-colors duration-200"
              style={{
                width: 8,
                minWidth: 8,
                background: "var(--bg-surface-secondary)",
                borderColor: "var(--border-primary)",
              }}
              onClick={() => setRoomListCollapsed(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--hover-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-surface-secondary)";
              }}
              title="Hiện danh sách room"
            >
              <div
                className="w-[2px] h-8 rounded-full"
                style={{ background: "var(--border-primary)" }}
              />
            </div>
          )}

          <ChatArea
            activeView={currentView}
            activeRoom={activeRoom}
            onToggleRoomList={() => setRoomListCollapsed((p) => !p)}
            onToggleMemberList={() => setMemberListCollapsed((p) => !p)}
            roomListCollapsed={roomListCollapsed}
            memberListCollapsed={memberListCollapsed}
            isCreatingRoom={isCreatingRoom}
            onCancelCreateRoom={() => setIsCreatingRoom(false)}
            isRoomSettingsOpen={isRoomSettingsOpen}
            onOpenRoomSettings={() => setIsRoomSettingsOpen(true)}
            onCloseRoomSettings={() => setIsRoomSettingsOpen(false)}
          />

          {/* Collapsed member list indicator */}
          {memberListCollapsed && (
            <div
              className="flex-shrink-0 h-screen flex flex-col items-center justify-center cursor-pointer border-l transition-colors duration-200"
              style={{
                width: 8,
                minWidth: 8,
                background: "var(--bg-surface-secondary)",
                borderColor: "var(--border-primary)",
              }}
              onClick={() => setMemberListCollapsed(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--hover-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-surface-secondary)";
              }}
              title="Hiện danh sách thành viên"
            >
              <div
                className="w-[2px] h-8 rounded-full"
                style={{ background: "var(--border-primary)" }}
              />
            </div>
          )}

          <div
            className="flex-shrink-0 h-screen overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              width: memberListCollapsed ? 0 : 240,
              minWidth: memberListCollapsed ? 0 : 240,
              opacity: memberListCollapsed ? 0 : 1,
            }}
          >
            <MemberList activeView={currentView} activeRoom={activeRoom} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
