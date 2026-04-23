import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { messages, directMessages, rooms } from "../data/mockData";
import { ChatHeader, ChatMessages, ChatInput } from "./chatarea/index.js";
import { SettingsView } from "./settings/index.js";
import { CreateRoomView } from "./createroom/index.js";
import { UserProfilePopup } from "./memberlist/index.js";
import {
  setSelectedUser,
  clearSelectedUser,
} from "../store/slices/chatSlice";
import {
  fetchMessages,
  addMessage as addDMMessage,
  setTyping,
  clearTyping,
  setActiveConversation,
  markConversationAsRead,
  createOrGetConversation,
  markConversationAsFetched,
} from "../store/slices/dmSlice";
import { addMessage } from "../store/slices/messageSlice";
import socketService from "../services/socket.service";

function ChatArea({ activeView, activeRoom, onToggleRoomList, onToggleMemberList, roomListCollapsed, memberListCollapsed, onOpenRoomSettings }) {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const { selectedUser, selectedDMUser } = useSelector(
    (state) => state.chat,
  );
  const { user: currentUser } = useSelector((state) => state.auth);
  const {
    messages: dmMessagesMap,
    activeConversationId,
    activeConversation,
    typing: typingMap,
    messagesLoading,
    fetchedConversations,
  } = useSelector((state) => state.dm);
  const appState = useSelector((state) => state.app);

  const room = activeRoom || appState.activeRoom;
  const view = activeView || appState.activeView;

  const [dmUser, setDmUser] = useState(null);
  const [isTyping, setIsTypingState] = useState(false);
  const [sendingMessages, setSendingMessages] = useState({}); // { [tempId]: { content, timestamp } }
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const typingTimeoutRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const processedTimers = useRef([]);
  const isCreatingConversationRef = useRef(false);

  const allRoomIds = Object.values(rooms).flat().map((r) => r.id);
  const isBotRoom = room === "tro-ly-ai";
  const isDM = (view === "messages") || (room && !allRoomIds.includes(room) && !isBotRoom);

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

  // Reset processedMessageIds when conversation changes
  useEffect(() => {
    processedMessageIds.current.clear();
    // Clear pending timers
    processedTimers.current.forEach((timer) => clearTimeout(timer));
    processedTimers.current = [];
  }, [activeConversationId]);

  // Join/leave DM via WebSocket - single effect
  useEffect(() => {
    if (!isDM || !activeConversationId) return;

    socketService.joinDM(activeConversationId);
    dispatch(markConversationAsRead(activeConversationId));

    return () => {
      socketService.leaveDM(activeConversationId);
    };
  }, [isDM, activeConversationId, dispatch]);

  // Fetch messages when active conversation changes — only if not already fetched
  useEffect(() => {
    if (!isDM || !activeConversationId) return;
    const isFetched = fetchedConversations[activeConversationId];
    console.log("[ChatArea] Check fetch:", { activeConversationId, isFetched, fetchedConversations });
    if (isFetched) return; // Skip: already cached
    dispatch(fetchMessages({ conversationId: activeConversationId, page: 1, limit: 50 }));
  }, [isDM, activeConversationId, dispatch, fetchedConversations]);

  // Use refs to keep stable handler references and avoid duplicate listeners
  const activeConversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Listen to WebSocket events for this DM - register once only
  useEffect(() => {
    if (!isDM) return;

    const handleNewDM = (data) => {
      if (!data?.id) return;
      if (processedMessageIds.current.has(data.id)) return;
      processedMessageIds.current.add(data.id);
      const timer = setTimeout(() => processedMessageIds.current.delete(data.id), 60000);
      processedTimers.current.push(timer);

      const conversationId = data.conversation_id || data.conversationId;
      const currentConvId = activeConversationIdRef.current;

      // Always cache the message regardless of which conversation is active
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

      // If this is the currently active conversation, also update UI state
      if (conversationId === currentConvId) {
        setSendingMessages((prev) => {
          const next = { ...prev };
          if (data.tempId && next[data.tempId]) {
            delete next[data.tempId];
          } else {
            Object.keys(next).forEach((key) => {
              if (next[key].content === data.content && data.sender_id === currentUserRef.current?.id) {
                delete next[key];
              }
            });
          }
          return next;
        });
      }
    };

    const handleDmSent = (data) => {
      if (data.success && data.message) {
        const currentConvId = activeConversationIdRef.current;
        setSendingMessages((prev) => {
          const next = { ...prev };
          if (data.tempId && next[data.tempId]) {
            delete next[data.tempId];
          } else {
            Object.keys(next).forEach((key) => {
              if (next[key].content === data.message.content) {
                delete next[key];
              }
            });
          }
          return next;
        });
        dispatch(
          addDMMessage({
            conversationId: currentConvId,
            message: {
              ...data.message,
              conversation_id: currentConvId,
            },
          })
        );
      }
    };

    const handleDmTyping = (data) => {
      const currentConvId = activeConversationIdRef.current;
      if (data.conversationId === currentConvId) {
        if (data.isTyping) {
          dispatch(
            setTyping({
              conversationId: data.conversationId,
              userId: data.userId,
              isTyping: true,
            })
          );
        } else {
          dispatch(clearTyping(data.conversationId));
        }
      }
    };

    const handleDmRead = (data) => {
      const currentConvId = activeConversationIdRef.current;
      if (data.conversationId === currentConvId) {
        dispatch({
          type: "dm/updateMessage",
          payload: {
            conversationId: currentConvId,
            messageId: data.messageId,
            updates: { is_read: true },
          },
        });
      }
    };

    socketService.onNewDM(handleNewDM);
    socketService.onDmSent(handleDmSent);
    socketService.onDmTyping(handleDmTyping);
    socketService.onDmRead(handleDmRead);

    return () => {
      socketService.off("newDM", handleNewDM);
      socketService.off("dmSent", handleDmSent);
      socketService.off("dmTyping", handleDmTyping);
      socketService.off("dmRead", handleDmRead);
    };
  }, [isDM, dispatch]);

  // Build messages for display
  // Use activeConversationId if available, fallback to room for existing conversations
  const conversationId = activeConversationId || (isDM && room && !isBotRoom ? room : null);
  const dmMessages = conversationId
    ? (dmMessagesMap[conversationId] || [])
    : [];

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
    const isOwn = msg.sender_id === currentUser?.id;
    const sender = isOwn
      ? (currentUser?.display_name || currentUser?.name || "Bạn")
      : (msg.sender?.display_name || "Unknown");
    const avatar = isOwn
      ? (currentUser?.display_name?.charAt(0).toUpperCase() || currentUser?.name?.charAt(0).toUpperCase() || "B")
      : (msg.sender?.display_name?.charAt(0).toUpperCase() || "?");
    const color = isOwn
      ? (currentUser?.color || null)
      : (msg.sender?.color || null);

    const timestamp = (() => {
      if (!msg.created_at) return "—";
      const date = new Date(msg.created_at);
      if (isNaN(date.getTime())) return msg.created_at;
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
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

  // Combine with mock data for non-DM or fallback
  const mockMessages = isDM ? directMessages[room] || [] : messages[room] || [];
  const userMessages = userMessagesMap[room] || [];

  const chatMessages = isDM && activeConversationId
    ? apiMessages
    : [...mockMessages, ...userMessages];

  // Typing indicator from other user
  const otherTyping = isDM && activeConversationId
    ? typingMap[activeConversationId]?.isTyping
    : false;

  const placeholder =
    isBotRoom || (isDM && room === "studybot-dm")
      ? "Hỏi trợ lý AI..."
      : dmUser
        ? `Nhắn tin cho ${dmUser.name}...`
        : "Nhắn tin cho nhóm học...";

  // Handle send message via WebSocket
  const handleSend = useCallback(async (content, replyToMsg, files) => {
    if (!content.trim()) return;

    if (isDM) {
      // Guard: prevent chatting with self
      if (dmUser?.id && dmUser.id === currentUser?.id) {
        console.warn("Cannot send message to yourself");
        return;
      }

      let conversationId = activeConversationId;

      // Lazy create conversation if not exists
      if (!conversationId && dmUser?.id) {
        // Prevent race condition: lock creation
        if (isCreatingConversationRef.current) return;
        isCreatingConversationRef.current = true;
        setIsCreatingConversation(true);

        try {
          const result = await dispatch(
            createOrGetConversation(dmUser.id)
          ).unwrap();
          if (result) {
            conversationId = result.id;
            dispatch(setActiveConversation(result));
          }
        } catch (err) {
          // Failed to create conversation
          isCreatingConversationRef.current = false;
          setIsCreatingConversation(false);
          return;
        }

        isCreatingConversationRef.current = false;
        setIsCreatingConversation(false);
      }

      if (!conversationId) return;

      // Send via WebSocket with tempId for tracking
      const tempId = `temp-${Date.now()}`;
      socketService.sendDM(conversationId, content.trim(), tempId);

      // Optimistic UI
      const optimisticMsg = {
        id: tempId,
        sender: currentUser?.display_name || currentUser?.name || "Bạn",
        avatar: currentUser?.display_name?.charAt(0).toUpperCase() || currentUser?.name?.charAt(0).toUpperCase() || "B",
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        content: content.trim(),
        isPinned: false,
        replyTo: replyToMsg || null,
        isOwn: true,
        senderId: currentUser?.id,
        is_read: false,
        created_at: new Date().toISOString(),
        pending: true,
      };

      // Track sending message (already have tempId from above)
      setSendingMessages((prev) => ({
        ...prev,
        [tempId]: { content: content.trim(), timestamp: Date.now() },
      }));

      dispatch(
        addDMMessage({
          conversationId,
          message: {
            id: optimisticMsg.id,
            conversation_id: conversationId,
            sender_id: currentUser?.id,
            content: content.trim(),
            is_read: false,
            created_at: optimisticMsg.created_at,
            sender: {
              id: currentUser?.id,
              display_name: currentUser?.display_name || currentUser?.name || "Bạn",
              avatar_url: currentUser?.avatar || null,
            },
            pending: true,
          },
        })
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
  }, [isDM, activeConversationId, dmUser, currentUser, dispatch, room]);

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
          if (isDM && dmUser && senderName !== (currentUser?.display_name || currentUser?.name)) {
            dispatch(setSelectedUser(dmUser));
          } else if (senderName !== (currentUser?.display_name || currentUser?.name)) {
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

function ChatAreaWrapper({ isCreatingRoom, onCancelCreateRoom, isRoomSettingsOpen, onOpenRoomSettings, onCloseRoomSettings, ...props }) {
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
