import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { dmService } from "../services/dm.service";
import socketService from "../services/socket.service";
import {
  fetchConversations,
  updateUserStatus,
  updateUserProfile,
} from "../store/slices/dmSlice";

const CONVERSATIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
  const { conversations, onlineUsers, conversationsFetched } = useSelector(
    (state) => state.dm,
  );

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState({}); // { [userId]: { online, lastSeen } }

  // Fetch conversations on mount — with localStorage TTL cache
  const isFetchingRef = useRef(false);
  useEffect(() => {
    if (conversationsFetched) return; // Skip: already in Redux

    // Check localStorage cache
    const lastFetch = localStorage.getItem("dm_conversations_last_fetch");
    const now = Date.now();
    if (lastFetch && now - parseInt(lastFetch, 10) < CONVERSATIONS_CACHE_TTL) {
      return; // Cache still valid
    }

    if (isFetchingRef.current) return; // Prevent duplicate requests
    isFetchingRef.current = true;

    dispatch(fetchConversations()).then(() => {
      localStorage.setItem("dm_conversations_last_fetch", String(Date.now()));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // 🆕 WebSocket listeners for online status — replaces polling
  useEffect(() => {
    const handleUserStatusChanged = (data) => {
      if (!data?.userId) return;
      setOnlineStatus((prev) => ({
        ...prev,
        [data.userId]: {
          online: data.status === "online",
          lastSeen: data.lastSeen || null,
        },
      }));
      dispatch(updateUserStatus({ userId: data.userId, status: data.status }));
    };

    const handleOnlineUsers = (data) => {
      if (!data?.users) return;
      const next = {};
      data.users.forEach((uid) => {
        next[uid] = { online: true, lastSeen: null };
      });
      setOnlineStatus((prev) => {
        const merged = { ...prev };
        // Mark users not in list as offline
        Object.keys(merged).forEach((uid) => {
          if (!next[uid]) merged[uid] = { ...merged[uid], online: false };
        });
        // Mark users in list as online
        Object.keys(next).forEach((uid) => {
          merged[uid] = next[uid];
        });
        return merged;
      });
    };

    socketService.onUserStatusChanged(handleUserStatusChanged);
    socketService.onOnlineUsers(handleOnlineUsers);

    // Request initial online users list
    socketService.getOnlineUsers();

    return () => {
      socketService.offEvent("userStatusChanged");
      socketService.offEvent("onlineUsers");
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
              }),
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
  }, [searchQuery, dispatch]);

  // Normalize conversations for UI and sort by latest message (newest first)
  const normalizedConversations = [...conversations]
    .sort((a, b) => {
      const timeA = a.last_message?.created_at
        ? new Date(a.last_message.created_at).getTime()
        : 0;
      const timeB = b.last_message?.created_at
        ? new Date(b.last_message.created_at).getTime()
        : 0;
      return timeB - timeA; // Descending: newest first
    })
    .map((conv) => ({
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
