import { useState, useRef, useEffect } from "react";
import { FiPaperclip } from "react-icons/fi";
import { MessageActions, ReplyPreview, ReactionBar } from "./MessageActions";
import { renderMessageWithMentions } from "./MessageContent";
import FileAttachment from "./FileAttachment";
import { getUserColor } from "../../utils/userColor";

function ChatMessage({ msg, isDark, onReply, onEdit, onShowProfile }) {
  const senderColor = getUserColor(msg.sender);
  const [showActions, setShowActions] = useState(false);
  const [reactions, setReactions] = useState(msg.reactions || []);
  const [showPicker, setShowPicker] = useState(false);
  const isOwnMessage = msg.sender === "You";

  const handleAddReaction = (emoji) => {
    const existing = reactions.find((r) => r.emoji === emoji);
    if (existing) {
      setReactions(
        reactions.map((r) =>
          r.emoji === emoji ? { ...r, count: r.count + 1 } : r,
        ),
      );
    } else {
      setReactions([...reactions, { emoji, count: 1, users: ["You"] }]);
    }
    setShowPicker(false);
  };

  return (
    <div
      className="flex gap-3 px-3 py-2 rounded-lg transition-colors relative group"
      style={{
        background: showActions ? "var(--hover-primary)" : "transparent",
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowPicker(false);
      }}
    >
      {/* Action buttons on hover */}
      <MessageActions
        show={showActions}
        isDark={isDark}
        isOwnMessage={isOwnMessage}
        onReply={() => onReply(msg)}
        onEdit={() => onEdit(msg)}
        onReaction={handleAddReaction}
        showPicker={showPicker}
        onTogglePicker={() => setShowPicker(!showPicker)}
      />

      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 cursor-pointer"
        style={{
          background: msg.isBot ? "var(--tertiary-active)" : senderColor,
          color: msg.isBot
            ? "var(--tertiary)"
            : isDark
              ? "var(--bg-surface)"
              : "#fff",
          fontSize: msg.isBot ? "1.25rem" : "0.875rem",
        }}
        onClick={() => onShowProfile && onShowProfile(msg.sender)}
      >
        {msg.avatar}
      </div>
      <div className="flex-1 min-w-0">
        {/* Sender name and timestamp first */}
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className="text-[13px] font-semibold cursor-pointer"
            style={{
              color: msg.isBot ? "var(--tertiary)" : senderColor,
            }}
            onClick={() => onShowProfile && onShowProfile(msg.sender)}
          >
            {msg.sender}
          </span>
          {msg.isBot && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: "var(--tertiary-active)",
                color: "var(--tertiary)",
              }}
            >
              Bot
            </span>
          )}
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {msg.timestamp}
          </span>
        </div>
        {/* Reply preview below sender info */}
        <ReplyPreview replyTo={msg.replyTo} isDark={isDark} />
        {/* Message content */}
        <div
          className="text-sm leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          {renderMessageWithMentions(msg.content, isDark, onShowProfile)}
          {msg.isEdited && (
            <span
              className="ml-1 text-[10px] italic"
              style={{ color: "var(--text-muted)" }}
            >
              (đã chỉnh sửa)
            </span>
          )}
        </div>
        {msg.hasAttachment && msg.attachments && msg.attachments.length > 0 ? (
          <div className="mt-2 space-y-2">
            {msg.attachments.map((attachment, index) => (
              <FileAttachment
                key={index}
                attachment={attachment}
                isDark={isDark}
              />
            ))}
          </div>
        ) : msg.hasAttachment ? (
          <div
            className="flex items-center gap-2 mt-2 px-3 py-2 border rounded-md text-sm cursor-pointer"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--border-primary)",
              color: "var(--primary)",
            }}
          >
            <FiPaperclip size={14} /> {msg.attachmentName}
          </div>
        ) : null}
        {reactions.length > 0 && (
          <ReactionBar
            reactions={reactions}
            onAddReaction={handleAddReaction}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
}

function TypingIndicator({ isDark }) {
  return (
    <div className="flex gap-3 px-3 py-2">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
        style={{
          background: "var(--tertiary-active)",
          color: "var(--tertiary)",
        }}
      >
        🤖
      </div>
      <div className="flex items-center gap-1">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            background: "var(--tertiary)",
            animationDelay: "0ms",
          }}
        />
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            background: "var(--tertiary)",
            animationDelay: "150ms",
          }}
        />
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            background: "var(--tertiary)",
            animationDelay: "300ms",
          }}
        />
      </div>
    </div>
  );
}

function EmptyChatState({ dmUser, isDark, hasNoSelection }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--text-muted)" }}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div
        className="text-base font-semibold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {hasNoSelection
          ? "Chọn một cuộc trò chuyện"
          : dmUser
            ? `Bắt đầu trò chuyện với ${dmUser.name}`
            : "Chưa có tin nhắn nào"}
      </div>
      <div
        className="text-sm leading-relaxed max-w-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {hasNoSelection
          ? "Hãy chọn một ngườii bạn bên trái để bắt đầu nhắn tin."
          : dmUser
            ? "Hãy gửi lờii chào hoặc câu hỏi để bắt đầu cuộc trò chuyện đầu tiên nhé!"
            : "Chọn một cuộc trò chuyện để bắt đầu nhắn tin."}
      </div>
    </div>
  );
}

function ChatMessages({
  isDark,
  chatMessages,
  dmUser,
  onReply,
  isTyping,
  onEdit,
  onShowProfile,
  hasNoSelection,
}) {
  const messagesContainerRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Handle scroll event to detect when user reaches the top
  const handleScroll = (e) => {
    const container = e.target;
    // Check if scrolled to top (within 10px threshold)
    if (container.scrollTop < 10 && !isLoadingMore) {
      setIsLoadingMore(true);
      // Simulate loading older messages
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 1500);
    }
  };

  const hasMessages = chatMessages.length > 0;

  const isEmpty = !hasMessages && !isTyping;

  return (
    <div
      ref={messagesContainerRef}
      className={`flex-1 p-4 ${isEmpty ? "flex items-center justify-center overflow-hidden" : "overflow-y-auto"}`}
      onScroll={isEmpty ? undefined : handleScroll}
    >
      {isEmpty ? (
        <EmptyChatState dmUser={dmUser} isDark={isDark} hasNoSelection={hasNoSelection} />
      ) : (
        <div className="flex flex-col min-h-full justify-end gap-1 w-full">
          {/* Loading indicator at top when fetching older messages */}
          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2 py-3">
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    background: "var(--tertiary)",
                    animationDelay: "0ms",
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    background: "var(--tertiary)",
                    animationDelay: "150ms",
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    background: "var(--tertiary)",
                    animationDelay: "300ms",
                  }}
                />
              </div>
            </div>
          )}

          {chatMessages.map((msg) => (
            <ChatMessage
              key={msg.id}
              msg={msg}
              isDark={isDark}
              onReply={onReply}
              onEdit={onEdit}
              onShowProfile={onShowProfile}
            />
          ))}
          {isTyping && <TypingIndicator isDark={isDark} />}
        </div>
      )}
    </div>
  );
}

export default ChatMessages;
