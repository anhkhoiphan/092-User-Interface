import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
// REMOVED: No mock data fallback — all messages come from Redux store only
import { ChatHeader, ChatMessages, ChatInput } from "./chatarea/index.js";
import { SettingsView } from "./settings/index.js";
import { CreateRoomView } from "./createroom/index.js";
import { UserProfilePopup } from "./memberlist/index.js";
import { setSelectedUser, clearSelectedUser } from "../store/slices/chatSlice";
import {
  addMessage as addDMMessage,
  updateMessage,
  setTyping,
  clearTyping,
  setActiveConversation,
  markConversationAsRead,
  createOrGetConversation,
  clearUnreadCount,
  updateUserStatus,
  fetchMessages,
} from "../store/slices/dmSlice";
import { fetchRoomMessages } from "../store/slices/messageSlice";
import { addMessage } from "../store/slices/messageSlice";
import {
  createRoom,
  clearRoomUnreadCount,
} from "../store/slices/spaceSlice";
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
    onlineUsers,
  } = useSelector((state) => state.dm);
  const appState = useSelector((state) => state.app);
  const room = activeRoom || appState.activeRoom;
  const view = activeView || appState.activeView;
  const isAgentRoom = false;
  const [dmUser, setDmUser] = useState(null);
  const [isTyping, setIsTypingState] = useState(false);
  const [sendingMessages, setSendingMessages] = useState({}); // { [tempId]: { content, timestamp, sendTime } }
  const messageTimersRef = useRef({}); // { [tempId]: sendStartTime }
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [roomTypingUser, setRoomTypingUser] = useState(null); // { name, timeoutId }
  const roomTypingTimeoutRef = useRef(null); // Track typing timeout to clear properly
  const isCreatingConversationRef = useRef(false);
  const pendingMessageQueueRef = useRef([]); // Queue messages while creating conversation
  const sendingTimeoutsRef = useRef({}); // { [tempId]: timeoutId } - auto-clear pending after 10s

  const { spaces, roomsMap, membersMap } = useSelector((state) => state.space);

  // Find active spaceId for the current room
  const activeSpaceId = (() => {
    if (!room) return null;
    // Try from spaces array first
    const fromSpaces = spaces.find((s) =>
      (roomsMap[s.id] || []).some((r) => r.id === room),
    )?.id;
    if (fromSpaces) return fromSpaces;
    // Fallback: search directly in roomsMap keys
    for (const [spaceId, rooms] of Object.entries(roomsMap)) {
      if (rooms.some((r) => r.id === room)) return spaceId;
    }
    return null;
  })();

  const isBotRoom = room === "tro-ly-ai";

  // Check if current room is a space room (exists in roomsMap)
  const isSpaceRoom = room && !isBotRoom && Object.values(roomsMap).some(
    (rooms) => rooms.some((r) => r.id === room)
  );

  // DM view: either explicit messages view, or a room that looks like a DM conversation
  // (not a bot room and not a space room). DM conversations use UUID format.
  const isDM =
    view === "messages" ||
    (room && !isBotRoom && !isSpaceRoom && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(room));

  // Move useSelector hooks to top (was at line 281)
  const { messages: roomMessagesMap, messagesLoading: roomMessagesLoading, fetchedRooms } = useSelector((state) => state.message);

  // Build dmUser from selectedDMUser or activeConversation
  useEffect(() => {
    if (!isDM || !room) {
      setDmUser(null);
      return;
    }

    if (activeConversation?.other_user) {
      const ou = activeConversation.other_user;
      const isOnlineRealtime = onlineUsers.includes(String(ou.id));
      console.log("[ChatArea] onlineUsers:", onlineUsers, "ou.id:", ou.id, "isOnlineRealtime:", isOnlineRealtime, "ou.status:", ou.status);
      setDmUser({
        id: ou.id,
        name: ou.display_name || "Unknown",
        avatar: ou.avatar_url || null,
        color: ou.color || null,
        isOnline: isOnlineRealtime || ou.status === "online",
        isFriend: true,
        email: ou.email || "",
        bio: ou.bio || "",
        isBot: false,
      });
    } else if (selectedDMUser) {
      const userId = selectedDMUser.id || selectedDMUser.userId;
      const isOnlineRealtime = onlineUsers.includes(String(userId));
      setDmUser({
        id: userId,
        name: selectedDMUser.name || "Unknown",
        avatar: selectedDMUser.avatar || null,
        color: selectedDMUser.color || null,
        isOnline: isOnlineRealtime || selectedDMUser.isOnline || false,
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
  }, [room, isDM, selectedDMUser, activeConversation, onlineUsers]);



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

  // 🆕 Lazy load DM messages when opening a conversation
  useEffect(() => {
    if (
      !isDM ||
      !activeConversationId ||
      activeConversationId.toString().startsWith("temp-conv-")
    )
      return;

    const isFetched = fetchedConversations[activeConversationId];
    if (!isFetched) {
      dispatch(fetchMessages({ conversationId: activeConversationId, page: 1, limit: 50 }));
    }
  }, [isDM, activeConversationId, dispatch, fetchedConversations]);

  // 🆕 Lazy load room messages when entering a room
  useEffect(() => {
    if (!isSpaceRoom || !room) return;

    const isFetched = fetchedRooms[room];
    if (!isFetched) {
      dispatch(fetchRoomMessages({ roomId: room, page: 1, limit: 50 }));
    }
  }, [isSpaceRoom, room, dispatch, fetchedRooms]);

  // Listen for messageSent event to clear sending status
  useEffect(() => {
    if (!isSpaceRoom) return;

    const handleMessageSent = (data) => {
      console.log("[ChatArea] messageSent received:", JSON.stringify(data, null, 2));
      const tempId = data?.tempId || data?.temp_id;
      if (tempId) {
        console.log("[ChatArea] Clearing sendingMessages for tempId:", tempId);
        // Clear auto-clear timeout
        if (sendingTimeoutsRef.current[tempId]) {
          clearTimeout(sendingTimeoutsRef.current[tempId]);
          delete sendingTimeoutsRef.current[tempId];
        }
        setSendingMessages((prev) => {
          if (!prev[tempId]) {
            console.log("[ChatArea] tempId not found in sendingMessages:", tempId, Object.keys(prev));
            return prev;
          }
          const next = { ...prev };
          delete next[tempId];
          console.log("[ChatArea] Cleared tempId:", tempId);
          return next;
        });
      }
    };

    socketService.onMessageSent(handleMessageSent);
    return () => {
      socketService.off("messageSent", handleMessageSent);
    };
  }, [isSpaceRoom]);

  // Listen for room typing events
  useEffect(() => {
    if (!isSpaceRoom || !room) return;

    const handleUserTyping = (data) => {
      if (data.roomId === room && data.userId !== currentUser?.id) {
        setRoomTypingUser(data.senderName || "Someone");
        // Clear previous timeout before setting new one
        if (roomTypingTimeoutRef.current) {
          clearTimeout(roomTypingTimeoutRef.current);
        }
        // Auto-clear after 3s
        roomTypingTimeoutRef.current = setTimeout(() => {
          setRoomTypingUser((current) =>
            current === (data.senderName || "Someone") ? null : current
          );
        }, 3000);
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.roomId === room) {
        setRoomTypingUser(null);
      }
    };

    socketService.on("userTyping", handleUserTyping);
    socketService.on("userStopTyping", handleUserStopTyping);

    return () => {
      socketService.off("userTyping", handleUserTyping);
      socketService.off("userStopTyping", handleUserStopTyping);
      if (roomTypingTimeoutRef.current) {
        clearTimeout(roomTypingTimeoutRef.current);
        roomTypingTimeoutRef.current = null;
      }
    };
  }, [isSpaceRoom, room, currentUser?.id]);

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
      if (data?.success) {
        const tempId = data.tempId || data.temp_id;
        const now = Date.now();
        if (tempId && messageTimersRef.current[tempId]) {
          const latency = now - messageTimersRef.current[tempId];
          console.log(
            `%c[DM Latency] SEND | ${latency}ms | tempId: ${tempId}`,
            "color: #22c55e; font-weight: bold;",
          );
          delete messageTimersRef.current[tempId];
        }
        // Clear auto-clear timeout
        if (sendingTimeoutsRef.current[tempId]) {
          clearTimeout(sendingTimeoutsRef.current[tempId]);
          delete sendingTimeoutsRef.current[tempId];
        }
        setSendingMessages((prev) => {
          if (!prev[tempId]) return prev;
          const next = { ...prev };
          delete next[tempId];
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

  // ==================== Unified Message Formatting ====================
  // DM and Room messages use the same logic, just different data sources

  // Get raw messages based on view type
  const conversationId =
    activeConversationId || (isDM && room && !isBotRoom ? room : null);
  const rawMessages = isDM
    ? (conversationId ? dmMessagesMap[conversationId] || [] : [])
    : (roomMessagesMap[room] || []);

  // Sort messages by created_at ascending
  const sortedMessages = [...rawMessages].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    return String(a.id).localeCompare(String(b.id));
  });

  // Detect if sender is StudyBot bot
  const isStudyBot = (msg) => {
    const senderName = typeof msg.sender === "object"
      ? msg.sender?.display_name || msg.sender?.username || ""
      : typeof msg.sender === "string"
        ? msg.sender
        : "";
    const senderUsername = typeof msg.sender === "object"
      ? msg.sender?.username || ""
      : "";
    return senderName === "StudyBot" || senderUsername === "studybot";
  };

  // Convert API messages to unified UI format
  const chatMessages = sortedMessages.map((msg) => {
    const senderId = msg.sender_id || msg.senderId || msg.sender?.id;
    const isOwn = String(senderId) === String(currentUser?.id);
    const msgIsBot = isStudyBot(msg);
    // Handle both object sender (DM/WS) and string sender (old format)
    const senderName = isOwn
      ? currentUser?.display_name || currentUser?.name || "Bạn"
      : msgIsBot
        ? "StudyBot"
        : (typeof msg.sender === "object" && msg.sender?.display_name)
          ? msg.sender.display_name
          : (typeof msg.sender === "string" ? msg.sender : "Unknown");
    const avatar = isOwn
      ? currentUser?.display_name?.charAt(0).toUpperCase() ||
        currentUser?.name?.charAt(0).toUpperCase() ||
        "B"
      : msgIsBot
        ? "🤖"
        : (typeof msg.sender === "object" && msg.sender?.display_name)
          ? msg.sender.display_name.charAt(0).toUpperCase()
          : (typeof msg.sender === "string" ? msg.sender.charAt(0).toUpperCase() : "?");
    // Get color: own message from currentUser, DM other from dmUser, space from membersMap
    const color = (() => {
      if (isOwn) return currentUser?.color || null;
      if (msgIsBot) return null; // Bot uses tertiary color in ChatMessage component
      if (isDM && dmUser?.id && String(dmUser.id) === String(senderId)) {
        return dmUser.color || null;
      }
      if (isSpaceRoom && activeSpaceId && membersMap[activeSpaceId]) {
        const member = membersMap[activeSpaceId].find(
          (m) => String(m.id) === String(senderId),
        );
        return member?.color || member?.profile?.color || null;
      }
      return msg.sender?.color || null;
    })();

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
      sender: senderName,
      avatar,
      color,
      timestamp,
      content: msg.content,
      isPinned: msg.is_pinned || false,
      replyTo: msg.reply_to || null,
      isOwn,
      isBot: msgIsBot,
      senderId,
      pending: msg.pending || false,
      is_read: msg.is_read,
      created_at: msg.created_at,
    };
  });

  // Join space room via WebSocket
  // NOTE: We intentionally do NOT leaveRoom on cleanup.
  // Once joined, the user stays in the room to receive real-time messages
  // even when switching to another room, DM, or tab.
  // This matches DM behavior where all conversations are joined permanently.
  const [joinedRoom, setJoinedRoom] = useState(null);
  useEffect(() => {
    if (isSpaceRoom && room) {
      socketService.joinRoom(room).then(() => {
        setJoinedRoom(room);
      }).catch((err) => {
        console.error("[ChatArea] Failed to join room:", err);
      });
      // No cleanup leave — keep receiving messages for this room
    }
  }, [isSpaceRoom, room]);

  // 🆕 Clear room unread count when opening a room
  useEffect(() => {
    if (isSpaceRoom && room) {
      dispatch(clearRoomUnreadCount({ roomId: room }));
    }
  }, [isSpaceRoom, room, dispatch]);

  // Space members are already fetched globally in App.jsx
  // No need to fetch again when entering a room

  // Typing indicator from other user
  const isOtherUserTyping = isDM && activeConversationId
    ? typingMap[activeConversationId]?.isTyping
    : false;
  const otherTyping = isOtherUserTyping;

  // Find current room info for placeholder
  const currentRoomInfo = isSpaceRoom
    ? Object.values(roomsMap).flat().find((r) => r.id === room)
    : null;

  // Check if we already know this room/DM has no messages (last_message is null from API)
  // This lets us skip loading skeleton and show empty state immediately
  const isKnownEmpty = (() => {
    if (isSpaceRoom && currentRoomInfo) {
      return currentRoomInfo.last_message === null || currentRoomInfo.last_message === undefined;
    }
    if (isDM && activeConversation) {
      return activeConversation.last_message === null || activeConversation.last_message === undefined;
    }
    return false;
  })();

  // Check if we're in a space view but no room selected yet
  const isSpaceViewNoRoom = view === "space" && !room && appState.activeSpace;
  const currentSpaceForWelcome = isSpaceViewNoRoom
    ? spaces.find((s) => s.id === appState.activeSpace)
    : null;

  const spaceWelcome = isSpaceViewNoRoom && currentSpaceForWelcome
    ? {
        title: `Chào mừng đến với ${currentSpaceForWelcome.name}`,
        description: currentSpaceForWelcome.description || "Hãy chọn một room bên trái để bắt đầu trò chuyện.",
      }
    : null;

  const placeholder = isBotRoom || (isDM && room === "studybot-dm")
    ? "Hỏi trợ lý AI..."
    : dmUser
      ? `Nhắn tin cho ${dmUser.name}...`
      : currentRoomInfo
        ? `Nhắn tin trong #${currentRoomInfo.name}...`
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

        // Auto-clear pending status after 10s if server doesn't confirm
        if (sendingTimeoutsRef.current[msgTempId]) {
          clearTimeout(sendingTimeoutsRef.current[msgTempId]);
        }
        sendingTimeoutsRef.current[msgTempId] = setTimeout(() => {
          setSendingMessages((prev) => {
            if (!prev[msgTempId]) return prev;
            const next = { ...prev };
            delete next[msgTempId];
            return next;
          });
          delete sendingTimeoutsRef.current[msgTempId];
        }, 10000);

        // Log send start
        console.log(
          `%c[DM Latency] START | tempId: ${msgTempId} | conv: ${conversationId || "NEW"}`,
          "color: #f59e0b; font-weight: bold;",
        );

        // Lazy create conversation if not exists
        if (!conversationId && dmUser?.id) {
          if (isCreatingConversationRef.current) {
            // Queue the message for retry after conversation is created
            console.warn("[ChatArea] Conversation creation in progress, message queued");
            pendingMessageQueueRef.current.push({
              content: contentTrimmed,
              replyToMsg,
              files,
              msgTempId,
            });
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

              // Join the real DM room so we can receive real-time messages
              socketService.joinDM(result.id);

              // Now send via WebSocket
              socketService.sendDM(result.id, contentTrimmed, msgTempId);

              // Process any queued messages
              const queued = pendingMessageQueueRef.current;
              pendingMessageQueueRef.current = [];
              for (const queuedMsg of queued) {
                const qTempId = queuedMsg.msgTempId || `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                socketService.sendDM(result.id, queuedMsg.content, qTempId);
                // Add optimistic message for queued items
                dispatch(
                  addDMMessage({
                    conversationId: result.id,
                    message: {
                      id: qTempId,
                      sender: currentUser?.display_name || currentUser?.name || "Bạn",
                      avatar:
                        currentUser?.display_name?.charAt(0).toUpperCase() ||
                        currentUser?.name?.charAt(0).toUpperCase() ||
                        "B",
                      timestamp: new Date().toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      content: queuedMsg.content,
                      isPinned: false,
                      replyTo: queuedMsg.replyToMsg || null,
                      isOwn: true,
                      senderId: currentUser?.id,
                      sender_id: currentUser?.id,
                      is_read: false,
                      created_at: new Date().toISOString(),
                      pending: true,
                      conversation_id: result.id,
                      sender: {
                        id: currentUser?.id,
                        display_name:
                          currentUser?.display_name || currentUser?.name || "Bạn",
                        avatar_url: currentUser?.avatar || null,
                      },
                    },
                  }),
                );
              }
            }
          } catch (err) {
            console.error("Failed to create conversation:", err);
            // Mark message as failed
            setSendingMessages((prev) => ({
              ...prev,
              [msgTempId]: {
                ...prev[msgTempId],
                failed: true,
                error: err?.message || "Không thể tạo cuộc trò chuyện",
              },
            }));
            // Also mark queued messages as failed
            pendingMessageQueueRef.current.forEach((queued) => {
              setSendingMessages((prev) => ({
                ...prev,
                [queued.msgTempId]: {
                  ...prev[queued.msgTempId],
                  failed: true,
                  error: err?.message || "Không thể tạo cuộc trò chuyện",
                },
              }));
            });
            pendingMessageQueueRef.current = [];
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
      } else if (isSpaceRoom && room) {
        // Space room message via WebSocket
        const msgTempId = `temp-${Date.now()}`;
        const contentTrimmed = content.trim();

        // Optimistic UI - same format as DM
        const optimisticMsg = {
          id: msgTempId,
          sender: {
            id: currentUser?.id,
            display_name: currentUser?.display_name || currentUser?.name || "Bạn",
            avatar_url: currentUser?.avatar || null,
          },
          sender_id: currentUser?.id,
          content: contentTrimmed,
          created_at: new Date().toISOString(),
          is_read: false,
          pending: true,
        };

        // Track sending message
        const sendStartTime = Date.now();
        messageTimersRef.current[msgTempId] = sendStartTime;
        setSendingMessages((prev) => ({
          ...prev,
          [msgTempId]: { content: contentTrimmed, timestamp: sendStartTime },
        }));

        // Auto-clear pending status after 10s if server doesn't confirm
        if (sendingTimeoutsRef.current[msgTempId]) {
          clearTimeout(sendingTimeoutsRef.current[msgTempId]);
        }
        sendingTimeoutsRef.current[msgTempId] = setTimeout(() => {
          setSendingMessages((prev) => {
            if (!prev[msgTempId]) return prev;
            const next = { ...prev };
            delete next[msgTempId];
            return next;
          });
          delete sendingTimeoutsRef.current[msgTempId];
        }, 10000);

        dispatch(addMessage({ roomId: room, message: optimisticMsg }));
        
        // Send with tempId so BE can echo it back
        socketService.sendMessage({ roomId: room, content: contentTrimmed, tempId: msgTempId });

        // Stop typing
        socketService.emitStopTyping(room);
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
    [isDM, activeConversationId, dmUser, currentUser, dispatch, room, isSpaceRoom, isBotRoom],
  );

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (isDM && activeConversationId) {
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
    } else if (isSpaceRoom && room) {
      // Space room typing with debounce
      socketService.emitTyping(room);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emitStopTyping(room);
      }, 3000);
    }
  }, [isDM, activeConversationId, isTyping, isSpaceRoom, room]);

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
      // Clear all pending sending timeouts
      Object.values(sendingTimeoutsRef.current).forEach(clearTimeout);
      sendingTimeoutsRef.current = {};
    };
  }, [isDM, activeConversationId]);

  const handleStopTyping = useCallback(() => {
    if (isDM && activeConversationId) {
      setIsTypingState(false);
      socketService.dmTyping(activeConversationId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } else if (isSpaceRoom && room) {
      socketService.emitStopTyping(room);
    }
  }, [isDM, activeConversationId, isSpaceRoom, room]);

  // Retry sending a failed message
  const handleRetryMessage = useCallback(
    (msg) => {
      if (!msg?.content) return;

      // Remove the failed status
      setSendingMessages((prev) => {
        const next = { ...prev };
        delete next[msg.id];
        return next;
      });

      // Re-send the message
      if (isDM && activeConversationId) {
        const newTempId = `temp-${Date.now()}`;
        socketService.sendDM(activeConversationId, msg.content, newTempId);

        // Add new optimistic message
        dispatch(
          addDMMessage({
            conversationId: activeConversationId,
            message: {
              id: newTempId,
              sender: currentUser?.display_name || currentUser?.name || "Bạn",
              avatar:
                currentUser?.display_name?.charAt(0).toUpperCase() ||
                currentUser?.name?.charAt(0).toUpperCase() ||
                "B",
              timestamp: new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              content: msg.content,
              isPinned: false,
              replyTo: msg.replyTo || null,
              isOwn: true,
              senderId: currentUser?.id,
              sender_id: currentUser?.id,
              is_read: false,
              created_at: new Date().toISOString(),
              pending: true,
              conversation_id: activeConversationId,
              sender: {
                id: currentUser?.id,
                display_name:
                  currentUser?.display_name || currentUser?.name || "Bạn",
                avatar_url: currentUser?.avatar || null,
              },
            },
          }),
        );

        // Track sending
        const sendStartTime = Date.now();
        messageTimersRef.current[newTempId] = sendStartTime;
        setSendingMessages((prev) => ({
          ...prev,
          [newTempId]: { content: msg.content, timestamp: sendStartTime },
        }));
      } else if (isSpaceRoom && room) {
        const newTempId = `temp-${Date.now()}`;
        socketService.sendMessage({
          roomId: room,
          content: msg.content,
          tempId: newTempId,
        });

        dispatch(
          addMessage({
            roomId: room,
            message: {
              id: newTempId,
              sender: {
                id: currentUser?.id,
                display_name:
                  currentUser?.display_name || currentUser?.name || "Bạn",
                avatar_url: currentUser?.avatar || null,
              },
              sender_id: currentUser?.id,
              content: msg.content,
              created_at: new Date().toISOString(),
              is_read: false,
              pending: true,
            },
          }),
        );

        const sendStartTime = Date.now();
        messageTimersRef.current[newTempId] = sendStartTime;
        setSendingMessages((prev) => ({
          ...prev,
          [newTempId]: { content: msg.content, timestamp: sendStartTime },
        }));
      }
    },
    [isDM, activeConversationId, isSpaceRoom, room, currentUser, dispatch],
  );

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
        roomName={currentRoomInfo?.name}
        roomDescription={currentRoomInfo?.description}
        spaceWelcome={spaceWelcome}
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
        spaceWelcome={spaceWelcome}
        isKnownEmpty={isKnownEmpty}
        sendingMessages={sendingMessages}
        isLoading={!isKnownEmpty && ((isDM && messagesLoading) || (isSpaceRoom && roomMessagesLoading))}
        conversationId={conversationId}
        roomId={isSpaceRoom ? room : null}
        onRetry={handleRetryMessage}
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
        isTyping={isBotRoom}
      />
      <ChatInput
        isDark={isDark}
        placeholder={placeholder}
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        disabled={!room}
        typingSender={
          isOtherUserTyping
            ? dmUser?.name
            : roomTypingUser
              ? roomTypingUser
              : null
        }
        otherTyping={otherTyping}
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
  const dispatch = useDispatch();
  const appState = useSelector((state) => state.app);
  const { isDark } = useSelector((state) => state.theme);
  const view = props.activeView || appState.activeView;

  if (isCreatingRoom) {
    return (
      <CreateRoomView
        onCancel={onCancelCreateRoom}
        onCreate={async (roomData) => {
          const spaceId = appState.activeSpace;
          if (!spaceId) {
            console.error("[CreateRoom] No active space");
            return;
          }
          try {
            console.log("[CreateRoom] Creating room in space:", spaceId, "data:", roomData);
            const payload = {
              name: roomData.name,
              description: roomData.topic || undefined,
              isPrivate: roomData.type === "private",
            };
            console.log("[CreateRoom] Payload:", payload);
            await dispatch(createRoom({
              spaceId,
              data: payload,
            })).unwrap();
            console.log("[CreateRoom] Success, closing view");
            onCancelCreateRoom();
          } catch (err) {
            console.error("[CreateRoom] Failed:", err);
            throw err;
          }
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
