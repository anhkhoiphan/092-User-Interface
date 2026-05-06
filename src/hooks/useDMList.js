import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { dmService } from "../services/dm.service";
import socketService from "../services/socket.service";
import {
  updateUserStatus,
  updateUserProfile,
} from "../store/slices/dmSlice";

// Format relative time for DM list
function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút`;
  if (diffHour < 24) return `${diffHour} giờ`;

  const isYesterday =
    now.getDate() - date.getDate() === 1 &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear();
  if (isYesterday) return "Hôm qua";

  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

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
  const { conversations, onlineUsers, conversationsFetched, messages: messagesMap } = useSelector(
    (state) => state.dm,
  );
  const currentUserId = useSelector((state) => state.auth.user?.id);

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState({}); // { [userId]: { online, lastSeen } }

  // Conversations are now fetched globally in App.jsx after auth
  // This hook only reads from Redux store, no need to fetch here
  // Background refresh is handled by App.jsx to avoid duplicate requests

  // Online status now handled globally in App.jsx via Redux
  // This effect only syncs from Redux to local state for DMList
  useEffect(() => {
    const next = {};
    onlineUsers.forEach((uid) => {
      next[uid] = { online: true, lastSeen: null };
    });
    setOnlineStatus(next);
  }, [onlineUsers]);

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

  // Helper: get latest message timestamp from Redux messages
  const getLatestMessageTime = (conversationId) => {
    const msgs = messagesMap[conversationId];
    if (!msgs || msgs.length === 0) return null;
    return [...msgs].reduce((latest, m) => {
      const t = m.created_at ? new Date(m.created_at).getTime() : 0;
      return t > latest ? t : latest;
    }, 0);
  };

  // Normalize conversations for UI and sort by latest message timestamp
  const normalizedConversations = [...conversations]
    .sort((a, b) => {
      const timeA = getLatestMessageTime(a.id) || (a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0);
      const timeB = getLatestMessageTime(b.id) || (b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0);
      return timeB - timeA; // newest first
    })
    .map((conv) => {
      // Get latest message from Redux (sorted by created_at)
      const msgs = messagesMap[conv.id];
      let latestMsg = null;
      if (msgs && msgs.length > 0) {
        latestMsg = [...msgs].sort((m1, m2) => {
          const t1 = m1.created_at ? new Date(m1.created_at).getTime() : 0;
          const t2 = m2.created_at ? new Date(m2.created_at).getTime() : 0;
          return t2 - t1;
        })[0];
      }
      const apiLastMsg = conv.last_message;
      const msgToShow = latestMsg || apiLastMsg;

      const isOwn = msgToShow?.sender_id && currentUserId && String(msgToShow.sender_id) === String(currentUserId);
      const prefix = isOwn ? "Bạn: " : "";
      const content = msgToShow?.content || "";
      const lastMessageText = content ? `${prefix}${content}` : (conv.isBot ? "Trợ lý AI" : "Bắt đầu trò chuyện");

      const timeStr = formatRelativeTime(msgToShow?.created_at || msgToShow?.timestamp);

      return {
        id: conv.id,
        userId: conv.other_user?.id,
        name: conv.other_user?.display_name || "Unknown",
        avatar: conv.other_user?.avatar_url || null,
        color: conv.other_user?.color || null,
        lastMessage: lastMessageText,
        lastMessageTime: timeStr,
        hasNewMessage: (conv.unread_count || 0) > 0,
        unreadCount: conv.unread_count || 0,
        isBot: false,
        email: conv.other_user?.email || "",
        mutualFriends: 0,
        conversation: conv,
      };
    });

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
