import { useState, useEffect, useCallback, useRef } from "react";
import { dmService } from "../services/dm.service";
import socketService from "../services/socket.service";

const POLLING_INTERVAL = 30000; // 30s polling fallback for status

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
  const keywords = ["studybot", "trợ lý", "trợ ly", "ai", "bot", "học tập", "study"];
  return keywords.some((k) => q.includes(k));
}

export function useDMList() {
  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState({}); // { [userId]: { online, lastSeen } }
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const statusPollingRef = useRef(null);

  // Fetch conversations on mount
  useEffect(() => {
    let mounted = true;

    const fetchConversations = async () => {
      try {
        const { data } = await dmService.getConversations();
        if (!mounted) return;

        // Normalize API response
        const normalized = (data.conversations || data || []).map((conv) => ({
          id: conv.id || conv.user_id,
          userId: conv.user_id || conv.id,
          name: conv.display_name || conv.name || "Unknown",
          avatar: conv.avatar_url || conv.avatar || null,
          color: conv.color || null,
          lastMessage: conv.last_message || "",
          hasNewMessage: conv.unread_count > 0,
          unreadCount: conv.unread_count || 0,
          isBot: conv.is_bot || false,
          email: conv.email || "",
          mutualFriends: conv.mutual_friends || 0,
        }));

        setConversations(normalized);
      } catch (err) {
        if (mounted) {
          // Silently fail — show empty state instead of loading/error
          setConversations([]);
        }
      }
    };

    fetchConversations();
    return () => {
      mounted = false;
    };
  }, []);

  // Search users via API only when searchQuery changes (triggered by Enter)
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

        // Inject StudyBot into search results if query matches
        if (matchesStudyBot(searchQuery)) {
          const hasStudyBot = normalized.some((u) => u.userId === STUDYBOT.userId);
          if (!hasStudyBot) {
            normalized = [STUDYBOT, ...normalized];
          }
        }

        setSearchResults(normalized);
      } catch (err) {
        if (mounted) {
          // If API fails but query matches StudyBot, still show StudyBot
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

  // Fetch online status for visible users
  const fetchStatuses = useCallback(async (userIds) => {
    if (!userIds.length) return;

    const results = await Promise.allSettled(
      userIds.map((id) => dmService.getUserStatus(id))
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

  // Initial status fetch + polling for visible users
  useEffect(() => {
    const visibleUserIds = searchQuery.trim()
      ? searchResults.map((u) => u.userId).filter(Boolean)
      : conversations.map((c) => c.userId).filter(Boolean);

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

  // Listen to realtime user status changes via WebSocket
  useEffect(() => {
    const handleStatusChange = (data) => {
      if (!data?.userId) return;
      setOnlineStatus((prev) => ({
        ...prev,
        [data.userId]: {
          online: data.status === "online",
          lastSeen: data.lastSeen || prev[data.userId]?.lastSeen || null,
        },
      }));
    };

    socketService.onUserStatusChanged(handleStatusChange);

    return () => {
      socketService.off("userStatusChanged", handleStatusChange);
    };
  }, []);

  // Derived list: single unified list, no friend/non-friend split
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((dm) =>
        dm.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  // Merge API search results with conversations for "global search"
  const globalSearchResults = searchQuery.trim()
    ? searchResults.map((user) => {
        const existing = conversations.find((c) => c.userId === user.userId);
        return existing || user;
      })
    : [];

  const isSearchingActive = searchQuery.trim().length > 0;

  return {
    conversations,
    items: isSearchingActive ? globalSearchResults : filteredConversations,
    onlineStatus,
    searchQuery,
    setSearchQuery,
    isLoading,
    isSearching,
    error,
    isSearchingActive,
    getUserOnlineStatus: (userId) =>
      onlineStatus[userId] || { online: false, lastSeen: null },
  };
}
