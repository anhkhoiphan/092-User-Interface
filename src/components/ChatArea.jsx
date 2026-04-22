import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { messages, directMessages, rooms } from "../data/mockData";
import { ChatHeader, ChatMessages, ChatInput } from "./chatarea/index.js";
import { SettingsView } from "./settings/index.js";
import { UserProfilePopup } from "./memberlist/index.js";
import {
  setReplyTo,
  cancelReply,
  setEditMessage,
  cancelEdit,
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
} from "../store/slices/dmSlice";
import { addMessage } from "../store/slices/messageSlice";
import socketService from "../services/socket.service";

function ChatArea({ activeView, activeRoom }) {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const { replyTo, editMessage, selectedUser, selectedDMUser } = useSelector(
    (state) => state.chat,
  );
  const { user: currentUser } = useSelector((state) => state.auth);
  const {
    messages: dmMessagesMap,
    activeConversationId,
    activeConversation,
    typing: typingMap,
    messagesLoading,
  } = useSelector((state) => state.dm);
  const appState = useSelector((state) => state.app);

  const room = activeRoom || appState.activeRoom;
  const view = activeView || appState.activeView;

  const [dmUser, setDmUser] = useState(null);
  const [isTyping, setIsTypingState] = useState(false);
  const [sendingMessages, setSendingMessages] = useState({}); // { [tempId]: { content, timestamp } }
  const typingTimeoutRef = useRef(null);
  const processedMessageIds = useRef(new Set());

  const allRoomIds = Object.values(rooms).flat().map((r) => r.id);
  const isBotRoom = room === "tro-ly-ai";
  const isDM = (view === "messages") || (room && !allRoomIds.includes(room) && !isBotRoom);

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

  // When DM room changes, set active conversation and fetch messages
  useEffect(() => {
    if (!isDM || !room) return;

    // If we have an activeConversation matching this room, use it
    if (activeConversation?.id === room) {
      dispatch(fetchMessages({ conversationId: room, page: 1, limit: 50 }));
      socketService.joinDM(room);
      dispatch(markConversationAsRead(room));
      return;
    }

    // Otherwise try to find conversation by userId in conversations list
    // This is handled by DMList when clicking a user
  }, [isDM, room, activeConversation, dispatch]);

  // Join/leave DM via WebSocket
  useEffect(() => {
    if (!isDM || !activeConversationId) return;

    socketService.joinDM(activeConversationId);
    dispatch(markConversationAsRead(activeConversationId));

    return () => {
      socketService.leaveDM(activeConversationId);
    };
  }, [isDM, activeConversationId, dispatch]);

  // Listen to WebSocket events for this DM
  useEffect(() => {
    if (!isDM || !activeConversationId) return;

    const handleNewDM = (data) => {
      // Received newDM from server
      if (!data?.id) return;
      if (processedMessageIds.current.has(data.id)) return;
      processedMessageIds.current.add(data.id);
      setTimeout(() => processedMessageIds.current.delete(data.id), 60000);

      const conversationId = data.conversation_id || data.conversationId;
      if (conversationId === activeConversationId) {
        // Remove from sendingMessages if exists
        setSendingMessages((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((key) => {
            if (next[key].content === data.content) {
              delete next[key];
            }
          });
          return next;
        });
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
      }
    };

    const handleDmSent = (data) => {
      // Received dmSent from server
      if (data.success && data.message) {
        // Remove from sendingMessages if exists
        setSendingMessages((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((key) => {
            if (next[key].content === data.message.content) {
              delete next[key];
            }
          });
          return next;
        });
        dispatch(
          addDMMessage({
            conversationId: activeConversationId,
            message: {
              ...data.message,
              conversation_id: activeConversationId,
            },
          })
        );
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
            })
          );
        } else {
          dispatch(clearTyping(data.conversationId));
        }
      }
    };

    const handleDmRead = (data) => {
      if (data.conversationId === activeConversationId) {
        // Update read status for messages
        // Backend handles this, we can refresh if needed
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
  }, [isDM, activeConversationId, dispatch]);

  // Build messages for display
  const dmMessages = isDM && activeConversationId
    ? (dmMessagesMap[activeConversationId] || [])
    : [];

  // Sort messages by created_at ascending (oldest first, newest last)
  const sortedDmMessages = [...dmMessages].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return dateA - dateB;
  });

  // Convert API messages to UI format
  const apiMessages = sortedDmMessages.map((msg) => {
    const isOwn = msg.sender_id === currentUser?.id;
    const sender = isOwn ? "You" : (msg.sender?.display_name || "Unknown");
    const avatar = isOwn
      ? (currentUser?.name?.charAt(0).toUpperCase() || "Y")
      : (msg.sender?.display_name?.charAt(0).toUpperCase() || "?");

    const date = new Date(msg.created_at);
    const timestamp = isNaN(date.getTime())
      ? msg.created_at
      : date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    return {
      id: msg.id,
      sender,
      avatar,
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
  const userMessagesMap = useSelector((state) => state.message.userMessages);
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
      let conversationId = activeConversationId;

      // Lazy create conversation if not exists
      if (!conversationId && dmUser?.id) {
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
          return;
        }
      }

      if (!conversationId) return;

      // Send via WebSocket
      // Send DM via WebSocket
      socketService.sendDM(conversationId, content.trim());

      // Optimistic UI
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        sender: "You",
        avatar: currentUser?.name?.charAt(0).toUpperCase() || "Y",
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

      // Track sending message
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
              display_name: currentUser?.name || "You",
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
        onReply={(msg) => {
          dispatch(setReplyTo(msg));
          dispatch(cancelEdit());
        }}
        onEdit={(msg) => {
          dispatch(setEditMessage(msg));
          dispatch(cancelReply());
        }}
        onShowProfile={(senderName) => {
          if (isDM && dmUser && senderName !== "You") {
            dispatch(setSelectedUser(dmUser));
          } else if (senderName !== "You") {
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
        replyTo={replyTo}
        onCancelReply={() => dispatch(cancelReply())}
        editMessage={editMessage}
        onCancelEdit={() => dispatch(cancelEdit())}
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
      />
    </div>
  );
}

function ChatAreaWrapper(props) {
  const appState = useSelector((state) => state.app);
  const { isDark } = useSelector((state) => state.theme);
  const view = props.activeView || appState.activeView;

  if (view === "settings") {
    return <SettingsView isDark={isDark} />;
  }

  return <ChatArea {...props} />;
}

export default ChatAreaWrapper;
