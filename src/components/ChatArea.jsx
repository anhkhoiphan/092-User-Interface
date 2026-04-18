import { useState, useEffect } from "react";
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
import { addMessage } from "../store/slices/messageSlice";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ChatArea({ activeView, activeRoom }) {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const { replyTo, editMessage, selectedUser, selectedDMUser } = useSelector(
    (state) => state.chat,
  );
  const appState = useSelector((state) => state.app);

  const room = activeRoom || appState.activeRoom;
  const view = activeView || appState.activeView;

  const [dmUser, setDmUser] = useState(null);

  const allRoomIds = Object.values(rooms).flat().map((r) => r.id);
  const isBotRoom = room === "tro-ly-ai";
  const isDM = (view === "messages") || (room && !allRoomIds.includes(room) && !isBotRoom);

  // Build dmUser from selectedDMUser or fallback
  useEffect(() => {
    if (!isDM || !room) {
      setDmUser(null);
      return;
    }

    if (selectedDMUser) {
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
      // Fallback if no selectedDMUser
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
  }, [room, isDM, selectedDMUser]);

  // Get all user messages object to avoid creating new array in selector
  const userMessagesMap = useSelector((state) => state.message.userMessages);
  const userMessages = userMessagesMap[room] || [];

  // Get mock messages and user-sent messages
  const mockMessages = isDM ? directMessages[room] || [] : messages[room] || [];
  const chatMessages = [...mockMessages, ...userMessages];

  const placeholder =
    isBotRoom || (isDM && room === "studybot-dm")
      ? "Hỏi trợ lý AI..."
      : dmUser
        ? `Nhắn tin cho ${dmUser.name}...`
        : "Nhắn tin cho nhóm học...";

  // Settings view
  if (view === "settings") {
    return <SettingsView isDark={isDark} />;
  }

  // Normal chat view
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
        onReply={(msg) => {
          dispatch(setReplyTo(msg));
          dispatch(cancelEdit());
        }}
        onEdit={(msg) => {
          dispatch(setEditMessage(msg));
          dispatch(cancelReply());
        }}
        onShowProfile={(senderName) => {
          // For DM, show the current dmUser if sender is not "You"
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
        isTyping={isBotRoom || (isDM && room === "studybot-dm")}
      />
      <ChatInput
        isDark={isDark}
        placeholder={placeholder}
        replyTo={replyTo}
        onCancelReply={() => dispatch(cancelReply())}
        editMessage={editMessage}
        onCancelEdit={() => dispatch(cancelEdit())}
        onSend={(content, replyToMsg, files) => {
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

          // Add attachment info if files are selected
          if (files && files.length > 0) {
            const firstFile = files[0];
            newMessage.hasAttachment = true;
            newMessage.attachmentName = firstFile.name;
            newMessage.attachmentType = firstFile.type.startsWith("image/")
              ? "image"
              : firstFile.type === "application/pdf"
                ? "pdf"
                : "other";
            newMessage.attachmentUrl = firstFile.preview || firstFile.name;
            newMessage.attachments = files.map((f) => ({
              name: f.name,
              type: f.type.startsWith("image/")
                ? "image"
                : f.type === "application/pdf"
                  ? "pdf"
                  : "other",
              url: f.preview || f.name,
            }));
          }

          dispatch(addMessage({ roomId: room, message: newMessage }));
        }}
      />
    </div>
  );
}

export default ChatArea;
