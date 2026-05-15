import { useState, useRef, useEffect, useCallback } from "react";
import { FiPaperclip, FiRefreshCw } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { ReplyPreview } from "./MessageActions";
import { renderMessageWithMentions } from "./MessageContent";
import FileAttachment from "./FileAttachment";
import QuizCard from "./QuizCard";
import { getUserColor } from "../../utils/userColor";
import { fetchMessages } from "../../store/slices/dmSlice";
import { fetchRoomMessages } from "../../store/slices/messageSlice";

function ChatMessage({
  msg,
  isDark,
  onReply,
  onEdit,
  onShowProfile,
  isSending,
  onRetry,
}) {
  const senderColor = getUserColor(msg.sender, msg.color);
  const isOwnMessage = msg.isOwn;
  const [isHovered, setIsHovered] = useState(false);
  const isFailed = msg.failed || isSending?.failed;
  const quizCardData = parseQuizMessage(msg.content);

  const handlePlayQuiz = (quizId) => {
    window.history.pushState(null, "", `/quiz/${quizId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div
      className="flex gap-3 px-3 py-2 rounded-lg transition-colors relative group"
      style={{
        background: isHovered ? "var(--hover-primary)" : "transparent",
        opacity: msg.pending ? 0.6 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 cursor-pointer"
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
          {msg.pending && !isFailed && (
            <span
              className="text-[10px] italic ml-1"
              style={{
                color: "var(--primary)",
                fontWeight: 500,
              }}
            >
              · Đang gửi...
            </span>
          )}
          {isFailed && (
            <span
              className="text-[10px] italic ml-1"
              style={{
                color: "#ef4444",
                fontWeight: 500,
              }}
            >
              · Gửi thất bại
            </span>
          )}
        </div>

        {/* Message content */}
        <div
          className="text-sm leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          {quizCardData ? (
            <QuizCard
              quizId={quizCardData.quizId}
              quizTitle={quizCardData.quizTitle}
              questionCount={quizCardData.questionCount}
              passingScore={quizCardData.passingScore}
              onPlay={handlePlayQuiz}
            />
          ) : (
            renderMessageWithMentions(
              msg.content,
              isDark,
              onShowProfile,
              msg.isBot,
            )
          )}
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

        {/* Retry button for failed messages */}
        {isFailed && onRetry && (
          <button
            onClick={() => onRetry(msg)}
            className="mt-1.5 flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors"
            style={{ color: "#ef4444" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#ef4444")}
          >
            <FiRefreshCw size={12} />
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
}

function parseQuizMessage(content) {
  if (!content || typeof content !== "string" || !content.includes("Quiz ID")) {
    return null;
  }

  const quizId = content.match(/Quiz ID:\s*`?([0-9a-f-]{36})`?/i)?.[1];
  if (!quizId) return null;

  const title =
    content.match(/\*\*([^*]+)\*\*/)?.[1]?.trim() ||
    content.match(/^#?\s*(.+)$/m)?.[1]?.trim() ||
    "Quiz";

  const questionCount = Number(
    content.match(/(\d+)\s*(?:câu hỏi|cau hoi|questions?)/i)?.[1] || 0,
  );
  const passingScore = Number(
    content.match(/(?:Cần|Can|Need)\s*(\d+)\s*(?:điểm|diem|points?)/i)?.[1] ||
      60,
  );

  return {
    quizId,
    quizTitle: title,
    questionCount,
    passingScore,
  };
}

function TypingIndicator({ isDark, senderName = "Đang nhập" }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-1.5"
      style={{ background: "transparent" }}
    >
      <span className="text-xs italic" style={{ color: "var(--primary)" }}>
        {senderName} đang nhập
      </span>
      <span className="flex gap-0.5">
        <span
          className="w-1 h-1 rounded-full animate-bounce"
          style={{
            background: "var(--primary)",
            animationDelay: "0ms",
          }}
        />
        <span
          className="w-1 h-1 rounded-full animate-bounce"
          style={{
            background: "var(--primary)",
            animationDelay: "150ms",
          }}
        />
        <span
          className="w-1 h-1 rounded-full animate-bounce"
          style={{
            background: "var(--primary)",
            animationDelay: "300ms",
          }}
        />
      </span>
    </div>
  );
}

function MessageSkeleton({ isDark, width = "75%", showSecondLine = true }) {
  return (
    <div className="flex gap-3 px-3 py-3 animate-pulse">
      <div
        className="w-9 h-9 rounded-lg flex-shrink-0"
        style={{
          background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        }}
      />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3.5 w-24 rounded"
            style={{
              background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            }}
          />
          <div
            className="h-3 w-12 rounded"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
            }}
          />
        </div>
        <div
          className="h-4 rounded"
          style={{
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            width: width,
          }}
        />
        {showSecondLine && (
          <div
            className="h-4 rounded"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
              width: "50%",
            }}
          />
        )}
      </div>
    </div>
  );
}

function EmptyChatState({ dmUser, isDark, hasNoSelection, spaceWelcome }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center">
      <div
        className="w-20 h-20 rounded-lg flex items-center justify-center mb-5"
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
        {spaceWelcome
          ? spaceWelcome.title
          : hasNoSelection
            ? "Chọn một cuộc trò chuyện"
            : dmUser
              ? `Bắt đầu trò chuyện với ${dmUser.name}`
              : "Chưa có tin nhắn nào"}
      </div>
      <div
        className="text-sm leading-relaxed max-w-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {spaceWelcome
          ? spaceWelcome.description
          : hasNoSelection
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
  onEdit,
  onShowProfile,
  hasNoSelection,
  spaceWelcome,
  isKnownEmpty,
  sendingMessages,
  isLoading,
  conversationId,
  roomId,
  onRetry,
}) {
  const dispatch = useDispatch();
  const messagesContainerRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const prevLoadingRef = useRef(isLoading);
  const prevMessagesLengthRef = useRef(chatMessages.length);
  const prevConversationIdRef = useRef(conversationId);
  const hasMoreMessagesRef = useRef(true);

  // Track if we have cached messages displayed while background loading
  const hasCachedMessages = chatMessages.length > 0 && isLoading;

  // Reset pagination state when conversation or room changes
  useEffect(() => {
    setCurrentPage(1);
    hasMoreMessagesRef.current = true;
  }, [conversationId, roomId]);

  // Auto scroll to bottom when loading finishes, new messages arrive, or conversation changes
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Scroll to bottom when conversation changes
    if (prevConversationIdRef.current !== conversationId) {
      container.scrollTop = container.scrollHeight;
    }

    // Scroll to bottom when loading finishes
    if (prevLoadingRef.current && !isLoading) {
      container.scrollTop = container.scrollHeight;
    }

    // Scroll to bottom when new messages added (but not when loading more)
    if (chatMessages.length > prevMessagesLengthRef.current && !isLoadingMore) {
      container.scrollTop = container.scrollHeight;
    }

    prevLoadingRef.current = isLoading;
    prevMessagesLengthRef.current = chatMessages.length;
    prevConversationIdRef.current = conversationId;
  }, [isLoading, chatMessages.length, isLoadingMore, conversationId]);

  // Handle scroll event to detect when user reaches the top
  const handleScroll = useCallback(
    (e) => {
      const container = e.target;
      // Check if scrolled to top (within 10px threshold)
      if (
        container.scrollTop < 10 &&
        !isLoadingMore &&
        hasMoreMessagesRef.current
      ) {
        // DM pagination
        if (
          conversationId &&
          !conversationId.toString().startsWith("temp-conv-")
        ) {
          setIsLoadingMore(true);
          const nextPage = currentPage + 1;
          dispatch(
            fetchMessages({
              conversationId,
              page: nextPage,
              limit: 50,
            }),
          )
            .unwrap()
            .then((result) => {
              const fetched = result.messages || [];
              if (fetched.length === 0) {
                hasMoreMessagesRef.current = false;
              } else {
                setCurrentPage(nextPage);
              }
            })
            .catch((err) => {
              console.error("[ChatMessages] Failed to load more DM:", err);
            })
            .finally(() => {
              setIsLoadingMore(false);
            });
        }
        // Room pagination
        else if (roomId) {
          setIsLoadingMore(true);
          const nextPage = currentPage + 1;
          dispatch(
            fetchRoomMessages({
              roomId,
              page: nextPage,
              limit: 50,
            }),
          )
            .unwrap()
            .then((result) => {
              const fetched = result.messages || [];
              if (fetched.length === 0) {
                hasMoreMessagesRef.current = false;
              } else {
                setCurrentPage(nextPage);
              }
            })
            .catch((err) => {
              console.error("[ChatMessages] Failed to load more room:", err);
            })
            .finally(() => {
              setIsLoadingMore(false);
            });
        }
      }
    },
    [isLoadingMore, currentPage, conversationId, roomId, dispatch],
  );

  const hasMessages = chatMessages.length > 0;

  const isEmpty = !hasMessages && (!isLoading || isKnownEmpty);

  return (
    <div
      ref={messagesContainerRef}
      className={`flex-1 p-4 ${isEmpty ? "flex items-center justify-center overflow-hidden" : ` ${isLoading && !isKnownEmpty ? "overflow-hidden" : "overflow-y-auto"}`}`}
      onScroll={isEmpty ? undefined : handleScroll}
    >
      {isLoading && !hasMessages && !isKnownEmpty ? (
        <div className="flex flex-col gap-2 w-full min-h-full justify-end pb-2">
          <MessageSkeleton isDark={isDark} width="60%" showSecondLine={false} />
          <MessageSkeleton isDark={isDark} width="85%" />
          <MessageSkeleton isDark={isDark} width="40%" showSecondLine={false} />
          <MessageSkeleton isDark={isDark} width="70%" />
          <MessageSkeleton isDark={isDark} width="55%" showSecondLine={false} />
          <MessageSkeleton isDark={isDark} width="90%" />
          <MessageSkeleton isDark={isDark} width="45%" showSecondLine={false} />
          <MessageSkeleton isDark={isDark} width="78%" />
          <MessageSkeleton isDark={isDark} width="35%" showSecondLine={false} />
        </div>
      ) : isEmpty ? (
        <EmptyChatState
          dmUser={dmUser}
          isDark={isDark}
          hasNoSelection={hasNoSelection}
          spaceWelcome={spaceWelcome}
        />
      ) : (
        <div className="flex flex-col min-h-full justify-end gap-1 w-full">
          {/* Background loading indicator (when showing cached messages while fetching) */}
          {hasCachedMessages && (
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="flex items-center gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{
                    background: "var(--primary)",
                    animationDelay: "0ms",
                  }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{
                    background: "var(--primary)",
                    animationDelay: "150ms",
                  }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{
                    background: "var(--primary)",
                    animationDelay: "300ms",
                  }}
                />
              </div>
              <span
                className="text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                Đang cập nhật...
              </span>
            </div>
          )}

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
              isSending={sendingMessages?.[msg.id]}
              onReply={onReply}
              onEdit={onEdit}
              onShowProfile={onShowProfile}
              onRetry={onRetry}
            />
          ))}
          {/* Typing indicator removed — now shown in ChatInput instead */}
        </div>
      )}
    </div>
  );
}

export default ChatMessages;
