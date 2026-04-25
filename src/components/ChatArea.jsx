import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
// REMOVED: No mock data fallback — all messages come from Redux store only
import { ChatHeader, ChatMessages, ChatInput } from "./chatarea/index.js";
import { SettingsView } from "./settings/index.js";
import { CreateRoomView } from "./createroom/index.js";
import { UserProfilePopup } from "./memberlist/index.js";
import { setSelectedUser, clearSelectedUser } from "../store/slices/chatSlice";
import {
  fetchMessages,
  addMessage as addDMMessage,
  updateMessage,
  setTyping,
  clearTyping,
  setActiveConversation,
  markConversationAsRead,
  createOrGetConversation,
  clearUnreadCount,
} from "../store/slices/dmSlice";
import { addMessage } from "../store/slices/messageSlice";
import socketService from "../services/socket.service";

function ChatArea({
  activeView,
  activeRoom,
  onToggleRoomList,
  onToggleMemberList,
  roomListCollapsed,
  memberListCollapsed,
  onOpenRoomSettings,
}) {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const { selectedUser, selectedDMUser } = useSelector((state) => state.chat);
  const { user: currentUser } = useSelector((state) => state.auth);
  const {
    messages: dmMessagesMap,
    activeConversationId,
    activeConversation,
    typing: typingMap,
    messagesLoading,
    fetchedConversations,
    preloadPhase,
  } = useSelector((state) => state.dm);
  const appState = useSelector((state) => state.app);

  const room = activeRoom || appState.activeRoom;
  const view = activeView || appState.activeView;

  const [dmUser, setDmUser] = useState(null);
  const [isTyping, setIsTypingState] = useState(false);
  const [sendingMessages, setSendingMessages] = useState({}); // { [tempId]: { content, timestamp, sendTime } }
  const messageTimersRef = useRef({}); // { [tempId]: sendStartTime }
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isCreatingConversationRef = useRef(false);

  const isBotRoom = room === "tro-ly-ai";
  // DM view: either explicit messages view, or a room that looks like a DM conversation
  // (not a bot room and not a space room). Space rooms are set via setActiveRoom from
  // SpaceRoomList which uses mock room IDs. Since we no longer import mock rooms,
  // we detect DM by: view === "messages" OR room is a UUID-like conversation ID.
  const isDM =
    view === "messages" ||
    (room && !isBotRoom && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(room));

  // Move useSelector hooks to top (was at line 281)
  const userMessagesMap = useSelector((state) => state.message.userMessages);

  // Build dmUser from selectedDMUser or activeConversation
  useEffect(() => {
    if (!isDM || !room) {
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
  }, [room, isDM, selectedDMUser, activeConversation]);



  // Join DM via WebSocket when opening a conversation
  // NOTE: We intentionally do NOT leaveDM on cleanup.
  // Once joined, the user stays in the DM room to receive real-time messages
  // even when switching to another conversation or tab.
  // leaveDM is only called on logout (in authSlice).
  useEffect(() => {
    if (
      !isDM ||
      !activeConversationId ||
      activeConversationId.toString().startsWith("temp-conv-")
    )
      return;

    socketService.joinDM(activeConversationId);
    dispatch(markConversationAsRead(activeConversationId));
    
    // 🆕 Clear unread count when opening conversation
    dispatch(clearUnreadCount({ conversationId: activeConversationId }));
  }, [isDM, activeConversationId, dispatch]);

  // Fetch messages when active conversation changes — only if not already fetched
  // AND preload is complete. If preload is still running, messages will arrive
  // via setMessagesPreloaded soon — no need to duplicate the API call.
  useEffect(() => {
    if (
      !isDM ||
      !activeConversationId ||
      activeConversationId.toString().startsWith("temp-conv-")
    )
      return;

    // If preload is still in progress, skip fetching — messages are coming.
    // This prevents duplicate API calls when user clicks a conversation
    // before preloadDMData finishes.
    if (preloadPhase === "conversations" || preloadPhase === "messages") {
      console.log("[ChatArea] Preload in progress, skipping fetch for:", activeConversationId);
      return;
    }

    const isFetched = fetchedConversations[activeConversationId];
    console.log("[ChatArea] Check fetch:", {
      activeConversationId,
      isFetched,
      preloadPhase,
    });
    if (isFetched) return; // Skip: already cached
    dispatch(
      fetchMessages({
        conversationId: activeConversationId,
        page: 1,
        limit: 50,
      }),
    );
  }, [isDM, activeConversationId, dispatch, fetchedConversations, preloadPhase]);

  // 🆕 REMOVED: WebSocket listeners for newDM/dmSent/dmTyping/dmRead
  // These are now handled globally in App.jsx (Single Source of Truth).
  // ChatArea only reads from Redux store.
  //
  // Kept: dmTyping listener for typing indicator (only relevant when viewing a conversation)
  // Kept: dmRead listener for read receipts (only relevant when viewing a conversation)
  // Kept: dmSent listener for optimistic UI cleanup

  useEffect(() => {
    if (!isDM) return;

    const handleDmSent = (data) => {
      console.log("[DM Debug] dmSent event fired:", data);
      if (data.success) {
        const tempId = data.tempId;
        const now = Date.now();
        if (tempId && messageTimersRef.current[tempId]) {
          const serverProcessTime = now - messageTimersRef.current[tempId];
          console.log(
            `%c[DM Latency] SEND | serverProcess: ${serverProcessTime}ms | tempId: ${tempId}`,
            "color: #22c55e; font-weight: bold;",
          );
          delete messageTimersRef.current[tempId];
        }
        setSendingMessages((prev) => {
          const next = { ...prev };
          if (data.tempId && next[data.tempId]) {
            delete next[data.tempId];
          } else if (data.message?.content) {
            Object.keys(next).forEach((key) => {
              if (next[key].content === data.message.content) {
                delete next[key];
              }
            });
          }
          return next;
        });
      }
    };

    const handleDmTyping = (data) => {
      if (data.conversationId === activeConversationId) {
        if (data.isTyping) {
          dispatch(
            setTyping({
              conversationId: data.conversationId,
              userId: data.userId,
              isTyping: true,
            }),
          );
        } else {
          dispatch(clearTyping(data.conversationId));
        }
      }
    };

    const handleDmRead = (data) => {
      if (data.conversationId === activeConversationId) {
        dispatch(
          updateMessage({
            conversationId: activeConversationId,
            messageId: data.messageId,
            updates: { is_read: true },
          }),
        );
      }
    };

    console.log("[DM Debug] Registering dmSent listener");
    socketService.onDmSent(handleDmSent);
    socketService.onDmTyping(handleDmTyping);
    socketService.onDmRead(handleDmRead);

    return () => {
      socketService.off("dmSent", handleDmSent);
      socketService.off("dmTyping", handleDmTyping);
      socketService.off("dmRead", handleDmRead);
    };
  }, [isDM, activeConversationId, dispatch]);

  // Build messages for display
  // Use activeConversationId if available, fallback to room for existing conversations
  const conversationId =
    activeConversationId || (isDM && room && !isBotRoom ? room : null);
  const dmMessages = conversationId ? dmMessagesMap[conversationId] || [] : [];

  // Sort messages by created_at ascending (oldest first, newest last)
  // Stable sort: fallback to id comparison if timestamps are equal
  const sortedDmMessages = [...dmMessages].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    // Stable fallback: compare by id (string comparison for UUIDs)
    return String(a.id).localeCompare(String(b.id));
  });

  // Convert API messages to UI format
  const apiMessages = sortedDmMessages.map((msg) => {
    const isOwn = String(msg.sender_id) === String(currentUser?.id);
    const sender = isOwn
      ? currentUser?.display_name || currentUser?.name || "Bạn"
      : msg.sender?.display_name || "Unknown";
    const avatar = isOwn
      ? currentUser?.display_name?.charAt(0).toUpperCase() ||
        currentUser?.name?.charAt(0).toUpperCase() ||
        "B"
      : msg.sender?.display_name?.charAt(0).toUpperCase() || "?";
    const color = isOwn
      ? currentUser?.color || null
      : msg.sender?.color || null;

    const timestamp = (() => {
      if (!msg.created_at) return "—";
      const date = new Date(msg.created_at);
      if (isNaN(date.getTime())) return msg.created_at;
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    })();

    return {
      id: msg.id,
      sender,
      avatar,
      color,
      timestamp,
      content: msg.content,
      isPinned: false,
      replyTo: null,
      isOwn,
      senderId: msg.sender_id,
      is_read: msg.is_read,
      created_at: msg.created_at,
    };
  });

  // Messages ONLY from Redux store — no mock data fallback
  const chatMessages = isDM ? apiMessages : (userMessagesMap[room] || []);

  // Typing indicator from other user
  const otherTyping =
    isDM && activeConversationId
      ? typingMap[activeConversationId]?.isTyping
      : false;

  const placeholder =
    isBotRoom || (isDM && room === "studybot-dm")
      ? "Hỏi trợ lý AI..."
      : dmUser
        ? `Nhắn tin cho ${dmUser.name}...`
        : "Nhắn tin cho nhóm học...";

  // Handle send message via WebSocket
  const handleSend = useCallback(
    async (content, replyToMsg, files) => {
      if (!content.trim()) return;

      if (isDM) {
        // Guard: prevent chatting with self
        if (dmUser?.id && dmUser.id === currentUser?.id) {
          console.warn("Cannot send message to yourself");
          return;
        }

        let conversationId = activeConversationId;
        const contentTrimmed = content.trim();
        const msgTempId = `temp-${Date.now()}`;

        // Optimistic UI for message
        const optimisticMsg = {
          id: msgTempId,
          sender: currentUser?.display_name || currentUser?.name || "Bạn",
          avatar:
            currentUser?.display_name?.charAt(0).toUpperCase() ||
            currentUser?.name?.charAt(0).toUpperCase() ||
            "B",
          timestamp: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          content: contentTrimmed,
          isPinned: false,
          replyTo: replyToMsg || null,
          isOwn: true,
          senderId: currentUser?.id,
          sender_id: currentUser?.id,
          is_read: false,
          created_at: new Date().toISOString(),
          pending: true,
        };

        // Track sending message
        const sendStartTime = Date.now();
        messageTimersRef.current[msgTempId] = sendStartTime;
        setSendingMessages((prev) => ({
          ...prev,
          [msgTempId]: { content: contentTrimmed, timestamp: sendStartTime },
        }));

        // Log send start
        console.log(
          `%c[DM Latency] START | tempId: ${msgTempId} | conv: ${conversationId || "NEW"}`,
          "color: #f59e0b; font-weight: bold;",
        );

        // Lazy create conversation if not exists
        if (!conversationId && dmUser?.id) {
          if (isCreatingConversationRef.current) {
            // Queue the message instead of dropping it
            console.warn("[ChatArea] Conversation creation in progress, message queued");
            // Show feedback to user
            setSendingMessages((prev) => ({
              ...prev,
              [msgTempId]: {
                content: contentTrimmed,
                timestamp: Date.now(),
                queued: true,
              },
            }));
            return;
          }
          isCreatingConversationRef.current = true;
          setIsCreatingConversation(true);

          const tempConvId = `temp-conv-${dmUser.id}`;

          // Optimistically set active conversation
          const tempConv = {
            id: tempConvId,
            other_user: dmUser,
            isTemp: true,
            unread_count: 0,
          };
          dispatch(setActiveConversation(tempConv));

          // Optimistically add message
          dispatch(
            addDMMessage({
              conversationId: tempConvId,
              message: {
                ...optimisticMsg,
                conversation_id: tempConvId,
                sender: {
                  id: currentUser?.id,
                  display_name:
                    currentUser?.display_name || currentUser?.name || "Bạn",
                  avatar_url: currentUser?.avatar || null,
                },
              },
            }),
          );

          // Stop typing optimistic
          socketService.dmTyping(tempConvId, false);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }

          try {
            const result = await dispatch(
              createOrGetConversation(dmUser.id),
            ).unwrap();

            if (result) {
              // Swap temp ID with real ID in Redux
              dispatch({
                type: "dm/replaceTempConversation",
                payload: { tempId: tempConvId, realConversation: result },
              });

              // Now send via WebSocket
              socketService.sendDM(result.id, contentTrimmed, msgTempId);
            }
          } catch (err) {
            console.error("Failed to create conversation:", err);
            // Mark message as failed
            setSendingMessages((prev) => ({
              ...prev,
              [msgTempId]: {
                ...prev[msgTempId],
                failed: true,
              },
            }));
          } finally {
            isCreatingConversationRef.current = false;
            setIsCreatingConversation(false);
          }

          return;
        }

        if (!conversationId) return;

        // Existing conversation path
        socketService.sendDM(conversationId, contentTrimmed, msgTempId);

        dispatch(
          addDMMessage({
            conversationId,
            message: {
              ...optimisticMsg,
              conversation_id: conversationId,
              sender: {
                id: currentUser?.id,
                display_name:
                  currentUser?.display_name || currentUser?.name || "Bạn",
                avatar_url: currentUser?.avatar || null,
              },
            },
          }),
        );

        // Stop typing
        socketService.dmTyping(conversationId, false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      } else {
        // Legacy: dispatch to Redux for non-DM
        const newMessage = {
          id: Date.now(),
          sender: "You",
          avatar: "Y",
          timestamp: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          content,
          isPinned: false,
          replyTo: replyToMsg || null,
        };
        dispatch(addMessage({ roomId: room, message: newMessage }));
      }
    },
    [isDM, activeConversationId, dmUser, currentUser, dispatch, room],
  );

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isDM || !activeConversationId) return;

    if (!isTyping) {
      setIsTypingState(true);
      socketService.dmTyping(activeConversationId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingState(false);
      socketService.dmTyping(activeConversationId, false);
    }, 3000);
  }, [isDM, activeConversationId, isTyping]);

  // Cleanup typing on unmount / before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDM && activeConversationId) {
        socketService.dmTyping(activeConversationId, false);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also clear typing when unmounting
      if (isDM && activeConversationId) {
        socketService.dmTyping(activeConversationId, false);
      }
    };
  }, [isDM, activeConversationId]);

  const handleStopTyping = useCallback(() => {
    if (!isDM || !activeConversationId) return;
    setIsTypingState(false);
    socketService.dmTyping(activeConversationId, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isDM, activeConversationId]);

  return (
    <div
      className="flex-1 flex flex-col min-w-0"
      style={{ background: "var(--bg-surface)" }}
    >
      <ChatHeader
        isDark={isDark}
        activeRoom={room}
        isBotRoom={isBotRoom}
        isDM={isDM}
        dmUser={dmUser}
        onToggleRoomList={onToggleRoomList}
        onToggleMemberList={onToggleMemberList}
        roomListCollapsed={roomListCollapsed}
        memberListCollapsed={memberListCollapsed}
        onOpenRoomSettings={onOpenRoomSettings}
      />
      {/* User Profile Popup */}
      {selectedUser && (
        <UserProfilePopup
          user={selectedUser}
          isDark={isDark}
          onClose={() => dispatch(clearSelectedUser())}
          onSendMessage={(user) => {
            dispatch(clearSelectedUser());
          }}
        />
      )}

      <ChatMessages
        isDark={isDark}
        chatMessages={chatMessages}
        dmUser={dmUser}
        hasNoSelection={isDM && !dmUser}
        sendingMessages={sendingMessages}
        isLoading={isDM && messagesLoading}
        conversationId={conversationId}
        onShowProfile={(senderName) => {
          if (
            isDM &&
            dmUser &&
            senderName !== (currentUser?.display_name || currentUser?.name)
          ) {
            dispatch(setSelectedUser(dmUser));
          } else if (
            senderName !== (currentUser?.display_name || currentUser?.name)
          ) {
            dispatch(
              setSelectedUser({
                id: senderName.toLowerCase(),
                name: senderName,
                avatar: senderName.charAt(0).toUpperCase(),
                isOnline: true,
                isFriend: false,
                email: `${senderName.toLowerCase()}@vinclassroom.edu.vn`,
                mutualFriends: Math.floor(Math.random() * 10),
                sharedSpaces: ["Toán cao cấp"],
              }),
            );
          }
        }}
        isTyping={isBotRoom || (isDM && otherTyping)}
      />
      <ChatInput
        isDark={isDark}
        placeholder={placeholder}
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
      />
    </div>
  );
}

function ChatAreaWrapper({
  isCreatingRoom,
  onCancelCreateRoom,
  isRoomSettingsOpen,
  onOpenRoomSettings,
  onCloseRoomSettings,
  ...props
}) {
  const appState = useSelector((state) => state.app);
  const { isDark } = useSelector((state) => state.theme);
  const view = props.activeView || appState.activeView;

  if (isCreatingRoom) {
    return (
      <CreateRoomView
        onCancel={onCancelCreateRoom}
        onCreate={(roomData) => {
          console.log("Room created:", roomData);
          onCancelCreateRoom();
        }}
      />
    );
  }

  if (view === "settings") {
    return <SettingsView isDark={isDark} />;
  }

  return <ChatArea {...props} onOpenRoomSettings={onOpenRoomSettings} />;
}

export default ChatAreaWrapper;
