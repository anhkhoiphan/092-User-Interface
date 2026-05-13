import { useEffect, useState, useRef } from "react";
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
import TADashboard from "./pages/TADashboard";
import AppLoadingScreen from "./components/AppLoadingScreen";
import { initializeAuth } from "./store/slices/authSlice";
import {
  addMessage as addDMMessage,
  updateMessage as updateDMMessage,
  updateConversationLastMessage,
  incrementUnreadCount,
  addConversation,
  clearUnreadCount,
  setOnlineUsers,
  updateUserStatus,
  preloadAllData,
} from "./store/slices/dmSlice";
import { addMessage } from "./store/slices/messageSlice";
import {
  updateRoomLastMessage,
  incrementRoomUnreadCount,
  addJoinedRoom,
} from "./store/slices/spaceSlice";
import socketService from "./services/socket.service";

function App() {
  const dispatch = useDispatch();
  const { activeView, activeSpace, activeRoom, searchQuery, isSettings } =
    useSelector((state) => state.app);
  const { isAuthenticated, initialized, loading, isLoggingOut } = useSelector(
    (state) => state.auth,
  );
  const { appLoading, appLoadingPhase } = useSelector((state) => state.app);

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

  // 2. Fetch ALL data once after auth is ready
  const preloadStartTime = useRef(null);
  useEffect(() => {
    if (!isAuthenticated || !initialized) return;
    preloadStartTime.current = performance.now();
    dispatch(preloadAllData());
  }, [isAuthenticated, initialized, dispatch]);

  // Log preload time when loading finishes
  useEffect(() => {
    if (!appLoading && preloadStartTime.current !== null) {
      const elapsed = Math.round(performance.now() - preloadStartTime.current);
      console.log(`%c[Preload] Tất cả data đã load xong trong ${elapsed}ms`, "color: #22c55e; font-weight: bold; font-size: 14px;");
      preloadStartTime.current = null;
    }
  }, [appLoading]);

  // 3. Connect WebSocket when authenticated
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

  // ============================================
  // Global WebSocket DM Listener — REGISTERED ONCE ONLY
  // ============================================
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewDM = (data) => {
      if (!data?.id) return;

      const conversationId = data.conversation_id || data.conversationId;
      if (!conversationId) return;

      const now = Date.now();
      const isOwn = String(data.sender_id) === String(store.getState().auth.user?.id);
      if (!isOwn && data.clientSentAt) {
        const receiveDelay = now - data.clientSentAt;
        console.log(
          `%c[DM Latency] RECEIVE | delay: ${receiveDelay}ms | from: ${data.sender?.display_name || data.sender_id} | msgId: ${data.id}`,
          "color: #3b82f6; font-weight: bold;",
        );
      }

      const state = store.getState();
      const currentConversations = state.dm.conversations;
      const currentActiveId = state.dm.activeConversationId;
      const currentUserId = state.auth.user?.id;

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

      if (!convExists) {
        socketService.joinDM(conversationId);
      }

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
            tempId: data.tempId || data.temp_id,
          },
        }),
      );

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

      const isOwnMessage = String(data.sender_id) === String(currentUserId);
      if (conversationId !== currentActiveId && !isOwnMessage) {
        dispatch(incrementUnreadCount({ conversationId }));
      }
    };

    const handleDmSent = (data) => {
      if (!data?.success || !data?.message) return;
      const msg = data.message;
      const conversationId = msg.conversation_id || msg.conversationId;
      const tempId = data.tempId || data.temp_id;
      if (!conversationId) return;

      dispatch(
        addDMMessage({
          conversationId,
          message: {
            id: msg.id,
            conversation_id: conversationId,
            sender_id: msg.sender_id,
            content: msg.content,
            is_read: msg.is_read ?? false,
            created_at: msg.created_at || msg.timestamp,
            sender: msg.sender,
            tempId,
          },
        }),
      );

      dispatch(
        updateConversationLastMessage({
          conversationId,
          message: {
            id: msg.id,
            content: msg.content,
            created_at: msg.created_at || msg.timestamp,
          },
        }),
      );
    };

    const handleDmMarkedRead = (data) => {
      if (!data?.conversationId || !data?.messageId) return;
      dispatch(
        updateDMMessage({
          conversationId: data.conversationId,
          messageId: data.messageId,
          updates: { is_read: true },
        }),
      );
    };

    const handleConnected = (data) => {
      if (data?.onlineUsers) {
        dispatch(setOnlineUsers(data.onlineUsers));
      }
    };

    const handleUserStatusChanged = (data) => {
      if (!data?.userId) return;
      dispatch(updateUserStatus({ userId: data.userId, status: data.status }));
    };

    const handleNewMessage = (data) => {
      console.log("[App] newMessage received:", JSON.stringify(data, null, 2));
      const roomId = data.room_id || data.roomId;
      const content = data.content;
      const author = data.author;
      const senderId = data.user_id || data.senderId;
      const id = data.id;
      const tempId = data.tempId;

      if (!roomId || !content) return;

      console.log("[App] newMessage parsed:", { roomId, id, tempId, author, senderId });

      const state = store.getState();
      const currentActiveRoom = state.app.activeRoom;
      const currentUserId = state.auth.user?.id;
      const isOwnMessage = String(senderId) === String(currentUserId);

      // 1. Save message to Redux
      dispatch(
        addMessage({
          roomId,
          message: {
            id: id || Date.now(),
            sender: {
              id: senderId,
              display_name: author?.display_name || author?.username || "Unknown",
              avatar_url: author?.avatar_url || null,
            },
            sender_id: senderId,
            content,
            created_at: data.created_at || new Date().toISOString(),
            isPinned: data.is_pinned || false,
            isOwn: isOwnMessage,
            tempId,
          },
        }),
      );

      // 2. Update room's last_message in spaceSlice (for RoomList display)
      dispatch(
        updateRoomLastMessage({
          roomId,
          message: {
            id: id || Date.now(),
            content,
            created_at: data.created_at || new Date().toISOString(),
            sender_id: senderId,
            sender: author,
          },
        }),
      );

      // 3. Increment unread count if not viewing this room and not own message
      if (roomId !== currentActiveRoom && !isOwnMessage) {
        dispatch(incrementRoomUnreadCount({ roomId }));
      }
    };

    socketService.onConnected(handleConnected);
    socketService.onUserStatusChanged(handleUserStatusChanged);
    socketService.onNewDM(handleNewDM);
    socketService.onDmSent(handleDmSent);
    socketService.onDmMarkedRead(handleDmMarkedRead);
    socketService.onNewMessage(handleNewMessage);

    return () => {
      socketService.off("connected", handleConnected);
      socketService.off("userStatusChanged", handleUserStatusChanged);
      socketService.off("newDM", handleNewDM);
      socketService.off("dmSent", handleDmSent);
      socketService.off("dmMarkedRead", handleDmMarkedRead);
      socketService.off("newMessage", handleNewMessage);
    };
  }, [isAuthenticated, dispatch]);

  const currentView = isSettings ? "settings" : activeView;

  // Not initialized yet (checking auth state) OR logging out
  if (!initialized || isLoggingOut) {
    return <AppLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 🆕 Loading all data after login
  if (appLoading) {
    return <AppLoadingScreen />;
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
      ) : currentView === "dashboard" ? (
        <>
          <TADashboard />
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
