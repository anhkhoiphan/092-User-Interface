import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { dmService } from "../services/dm.service";
import socketService from "../services/socket.service";
import {
  fetchConversations,
  updateConversationLastMessage,
  setUnreadCount,
  updateUserStatus,
  updateUserProfile,
} from "../store/slices/dmSlice";

const POLLING_INTERVAL = 30000;

const STUDYBOT = {
  id: "studybot",
  userId: "studybot",
  name: "StudyBot",
  avatar: "🤖",
  lastMessage: "",
  hasNewMessage: false,
  unreadCount: 0,
  isBot: true,
  email: "studybot@vinclassroom.edu.vn",
  bio: "Trợ lý AI học tập của bạn",
};

function matchesStudyBot(query) {
  if (!query) return false;
  const q = query.toLowerCase();
  const keywords = [
    "studybot",
    "trợ lý",
    "trợ ly",
    "ai",
    "bot",
    "học tập",
    "study",
  ];
  return keywords.some((k) => q.includes(k));
}

export function useDMList() {
  const dispatch = useDispatch();
  const { conversations, onlineUsers } = useSelector((state) => state.dm);

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState({}); // { [userId]: { online, lastSeen } }

  const statusPollingRef = useRef(null);
  const processedMessageIds = useRef(new Set());

  // Fetch conversations on mount
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Listen to realtime updates via WebSocket
  useEffect(() => {
    // New DM message
    const handleNewDM = (data) => {
      if (!data?.id) return;
      if (processedMessageIds.current.has(data.id)) return;
      processedMessageIds.current.add(data.id);
      setTimeout(() => processedMessageIds.current.delete(data.id), 60000);

      const conversationId = data.conversation_id || data.conversationId;
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
    };

    // User status changed
    const handleStatusChange = (data) => {
      if (!data?.userId) return;
      dispatch(updateUserStatus({ userId: data.userId, status: data.status }));
      setOnlineStatus((prev) => ({
        ...prev,
        [data.userId]: {
          online: data.status === "online",
          lastSeen: data.lastSeen || prev[data.userId]?.lastSeen || null,
        },
      }));
    };

    // Online users list
    const handleOnlineUsers = (data) => {
      if (data?.users) {
        // Update local online status map
        const next = {};
        data.users.forEach((uid) => {
          next[uid] = { online: true, lastSeen: null };
        });
        setOnlineStatus((prev) => {
          // Keep previous lastSeen for offline users
          const merged = { ...prev };
          Object.keys(merged).forEach((uid) => {
            if (!next[uid]) merged[uid] = { ...merged[uid], online: false };
          });
          Object.keys(next).forEach((uid) => {
            merged[uid] = next[uid];
          });
          return merged;
        });
      }
    };

    // Connected ack
    const handleConnected = (data) => {
      if (data?.onlineUsers) {
        const next = {};
        data.onlineUsers.forEach((uid) => {
          next[uid] = { online: true, lastSeen: null };
        });
        setOnlineStatus(next);
      }
    };

    socketService.onNewDM(handleNewDM);
    socketService.onUserStatusChanged(handleStatusChange);
    socketService.onOnlineUsers(handleOnlineUsers);
    socketService.on("connected", handleConnected);

    return () => {
      socketService.off("newDM", handleNewDM);
      socketService.off("userStatusChanged", handleStatusChange);
      socketService.off("onlineUsers", handleOnlineUsers);
      socketService.off("connected", handleConnected);
    };
  }, [dispatch]);

  // Search users via API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let mounted = true;

    const doSearch = async () => {
      try {
        setSearchResults([]);
        setIsSearching(true);
        const { data } = await dmService.searchUsers(searchQuery.trim());
        if (!mounted) return;

        let normalized = (data.users || []).map((user) => ({
          id: user.id,
          userId: user.id,
          name: user.display_name || user.email || "Unknown",
          avatar: user.avatar_url || null,
          color: user.color || null,
          lastMessage: "",
          hasNewMessage: false,
          unreadCount: 0,
          isBot: false,
          email: user.email || "",
          bio: user.bio || "",
        }));

        if (matchesStudyBot(searchQuery)) {
          const hasStudyBot = normalized.some(
            (u) => u.userId === STUDYBOT.userId,
          );
          if (!hasStudyBot) {
            normalized = [STUDYBOT, ...normalized];
          }
        }

        // Update Redux store with user profile info (including color)
        normalized.forEach((user) => {
          if (user.color) {
            dispatch(
              updateUserProfile({
                userId: user.userId,
                updates: {
                  color: user.color,
                  display_name: user.name,
                  avatar_url: user.avatar,
                },
              })
            );
          }
        });

        setSearchResults(normalized);
      } catch (err) {
        if (mounted) {
          if (matchesStudyBot(searchQuery)) {
            setSearchResults([STUDYBOT]);
          } else {
            setSearchResults([]);
          }
        }
      } finally {
        if (mounted) setIsSearching(false);
      }
    };

    doSearch();

    return () => {
      mounted = false;
    };
  }, [searchQuery]);

  // Polling online status for visible users
  const fetchStatuses = useCallback(async (userIds) => {
    if (!userIds.length) return;
    const results = await Promise.allSettled(
      userIds.map((id) => dmService.getUserStatus(id)),
    );
    setOnlineStatus((prev) => {
      const next = { ...prev };
      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          const { online, lastSeen } = result.value.data || {};
          next[userIds[idx]] = { online: !!online, lastSeen: lastSeen || null };
        }
      });
      return next;
    });
  }, []);

  useEffect(() => {
    const visibleUserIds = searchQuery.trim()
      ? searchResults.map((u) => u.userId).filter(Boolean)
      : conversations.map((c) => c.other_user?.id).filter(Boolean);

    if (!visibleUserIds.length) return;

    fetchStatuses(visibleUserIds);

    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }
    statusPollingRef.current = setInterval(() => {
      fetchStatuses(visibleUserIds);
    }, POLLING_INTERVAL);

    return () => {
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
    };
  }, [conversations, searchResults, searchQuery, fetchStatuses]);

  // Normalize conversations for UI
  const normalizedConversations = conversations.map((conv) => ({
      id: conv.id,
      userId: conv.other_user?.id,
      name: conv.other_user?.display_name || "Unknown",
      avatar: conv.other_user?.avatar_url || null,
      color: conv.other_user?.color || null,
      lastMessage: conv.last_message?.content || "",
      hasNewMessage: (conv.unread_count || 0) > 0,
      unreadCount: conv.unread_count || 0,
      isBot: false,
      email: conv.other_user?.email || "",
      mutualFriends: 0,
      conversation: conv,
  }));

  const filteredConversations = searchQuery.trim()
    ? normalizedConversations.filter((dm) =>
        dm.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : normalizedConversations;

  const globalSearchResults = searchQuery.trim()
    ? searchResults.map((user) => {
        const existing = normalizedConversations.find(
          (c) => c.userId === user.userId,
        );
        // Merge: prefer search result data (has color) but keep conversation data if available
        return existing
          ? { ...user, ...existing, color: user.color || existing.color }
          : user;
      })
    : [];

  const isSearchingActive = searchQuery.trim().length > 0;

  return {
    conversations: normalizedConversations,
    items: isSearchingActive ? globalSearchResults : filteredConversations,
    onlineStatus,
    searchQuery,
    setSearchQuery,
    isLoading: false, // handled by Redux
    isSearching,
    error,
    isSearchingActive,
    getUserOnlineStatus: (userId) =>
      onlineStatus[userId] || { online: false, lastSeen: null },
  };
}
