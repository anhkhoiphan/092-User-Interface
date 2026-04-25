import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { store } from "./store/store.js";
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
import AppLoadingScreen from "./components/AppLoadingScreen";
import { initializeAuth } from "./store/slices/authSlice";
import {
  addMessage as addDMMessage,
  updateConversationLastMessage,
  incrementUnreadCount,
  preloadDMData,
  addConversation,
  updateMessage,
  clearUnreadCount,
} from "./store/slices/dmSlice";
import socketService from "./services/socket.service";

function App() {
  const dispatch = useDispatch();
  const { activeView, activeSpace, activeRoom, searchQuery, isSettings } =
    useSelector((state) => state.app);
  const { isAuthenticated, initialized, loading, isLoggingOut } = useSelector(
    (state) => state.auth,
  );
  const { preloadComplete, preloadPhase, preloadError } = useSelector(
    (state) => state.dm,
  );

  const [createTab, setCreateTab] = useState("space");
  const [editingAgent, setEditingAgent] = useState(null);
  const [roomListCollapsed, setRoomListCollapsed] = useState(false);
  const [memberListCollapsed, setMemberListCollapsed] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);

  // 1. Auth initialization
  useEffect(() => {
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
    if (!initialized && !loading) {
      dispatch(initializeAuth());
    }
  }, [dispatch, initialized, loading]);

  // 2. Connect WebSocket when authenticated
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

  // 🆕 3. Preload DM data after auth + socket connected
  useEffect(() => {
    if (!isAuthenticated || !initialized) return;
    if (preloadComplete) return;

    dispatch(preloadDMData());
  }, [isAuthenticated, initialized, preloadComplete, dispatch]);

  // ============================================
  // Global WebSocket DM Listener — REGISTERED ONCE ONLY
  // ============================================
  // This effect runs ONLY when isAuthenticated changes (login/logout).
  // The handler uses store.getState() to always read fresh Redux state,
  // so it never needs to re-register when state changes.
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewDM = (data) => {
      if (!data?.id) return;

      const conversationId = data.conversation_id || data.conversationId;
      if (!conversationId) return;

      // Log receive latency
      const now = Date.now();
      const isOwn = String(data.sender_id) === String(store.getState().auth.user?.id);
      if (!isOwn && data.clientSentAt) {
        const receiveDelay = now - data.clientSentAt;
        console.log(
          `%c[DM Latency] RECEIVE | delay: ${receiveDelay}ms | from: ${data.sender?.display_name || data.sender_id} | msgId: ${data.id}`,
          "color: #3b82f6; font-weight: bold;",
        );
      }

      // Always read fresh state from store — never stale closure
      const state = store.getState();
      const currentConversations = state.dm.conversations;
      const currentActiveId = state.dm.activeConversationId;
      const currentUserId = state.auth.user?.id;

      // 0. Ensure conversation exists in list
      const convExists = currentConversations.some((c) => c.id === conversationId);
      if (!convExists && data.conversation) {
        dispatch(addConversation(data.conversation));
      } else if (!convExists && data.sender) {
        dispatch(
          addConversation({
            id: conversationId,
            other_user: data.sender,
            last_message: {
              id: data.id,
              content: data.content,
              created_at: data.created_at || data.timestamp,
            },
            unread_count: 0,
            created_at: data.created_at || data.timestamp,
          }),
        );
      }

      // 1. Cache message into Redux
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
        }),
      );

      // 2. Update last_message in conversation list
      dispatch(
        updateConversationLastMessage({
          conversationId,
          message: {
            id: data.id,
            content: data.content,
            created_at: data.created_at || data.timestamp,
          },
        }),
      );

      // 3. Increment unread if NOT the currently active conversation
      const isOwnMessage = String(data.sender_id) === String(currentUserId);
      if (conversationId !== currentActiveId && !isOwnMessage) {
        dispatch(incrementUnreadCount({ conversationId }));
      }
    };

    // Handle when other user reads our messages
    const handleDmMarkedRead = (data) => {
      if (!data?.conversationId || !data?.messageId) return;
      dispatch(
        updateMessage({
          conversationId: data.conversationId,
          messageId: data.messageId,
          updates: { is_read: true },
        }),
      );
    };

    socketService.onNewDM(handleNewDM);
    socketService.onDmMarkedRead(handleDmMarkedRead);

    return () => {
      socketService.offEvent("newDM");
      socketService.offEvent("dmMarkedRead");
    };
  }, [isAuthenticated, dispatch]);

  const currentView = isSettings ? "settings" : activeView;

  // Not initialized yet (checking auth state) OR logging out OR preload in progress
  if (!initialized || isLoggingOut || (isAuthenticated && !preloadComplete)) {
    return <AppLoadingScreen />;
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
          <RoomList
            activeView="createSpace"
            createTab={createTab}
            onCreateTabChange={setCreateTab}
          />
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
