import { useState, useEffect, useRef, useCallback } from "react";
import { FiX, FiPaperclip } from "react-icons/fi";
import { IoSend } from "react-icons/io5";
import MentionSuggestions from "./MentionSuggestions";
import FileAttachmentPreview from "./FileAttachmentPreview";
import { getUserColor } from "../../utils/userColor";
import { useSelector } from "react-redux";

// Allowed file types
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function ChatInput({
  isDark,
  placeholder,
  replyTo,
  onSend,
  onTyping,
  onStopTyping,
  typingSender,
  disabled,
}) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionStartOffset, setMentionStartOffset] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentions, setMentions] = useState([]);
  const [isEmpty, setIsEmpty] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get real users from Redux for mentions
  const { conversations } = useSelector((state) => state.dm);
  const { membersMap } = useSelector((state) => state.space);

  const allUsers = (() => {
    const users = [];
    const seenIds = new Set();

    // Add StudyBot as a mentionable user
    users.push({
      id: "studybot",
      name: "StudyBot",
      isBot: true,
    });
    seenIds.add("studybot");

    conversations.forEach((conv) => {
      const ou = conv.other_user;
      if (ou && !seenIds.has(ou.id)) {
        seenIds.add(ou.id);
        users.push({
          id: ou.id,
          name: ou.display_name || ou.name || "Unknown",
        });
      }
    });

    Object.values(membersMap).flat().forEach((member) => {
      if (member && !seenIds.has(member.id)) {
        seenIds.add(member.id);
        users.push({
          id: member.id,
          name: member.display_name || member.name || member.email || "Unknown",
        });
      }
    });

    return users;
  })();

  const placeholderText = placeholder;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowMentions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPlainText = useCallback(() => {
    if (editorRef.current) {
      return editorRef.current.innerText || "";
    }
    return "";
  }, []);

  const getCursorOffset = useCallback(() => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }, []);

  const checkForMention = useCallback(() => {
    const cursorOffset = getCursorOffset();
    const plainText = getPlainText();
    const textBeforeCursor = plainText.substring(0, cursorOffset);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9À-ỹ_]*)$/);

    if (mentionMatch) {
      setMentionFilter(mentionMatch[1]);
      setMentionStartOffset(cursorOffset - mentionMatch[0].length);
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionStartOffset(-1);
    }
  }, [getCursorOffset, getPlainText]);

  const handleInput = (e) => {
    checkForMention();
    const plainText = getPlainText();
    setIsEmpty(plainText.trim() === "");
    if (onTyping && plainText.trim().length > 0) {
      onTyping();
    }
  };

  const handleMentionSelect = (user) => {
    console.log("[ChatInput] Mention selected:", user);
    if (user === null) {
      setShowMentions(false);
      return;
    }

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const plainText = getPlainText();
    const cursorOffset = getCursorOffset();

    const textBeforeCursor = plainText.substring(0, cursorOffset);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9À-ỹ_]*)$/);
    if (!mentionMatch) return;

    const atPosition = cursorOffset - mentionMatch[0].length;
    const beforeText = plainText.substring(0, atPosition);
    const afterText = plainText.substring(cursorOffset);

    const mentionColor = getUserColor(user.name);
    const mentionSpan = document.createElement("span");
    mentionSpan.className = "mention-tag";
    mentionSpan.contentEditable = "false";
    mentionSpan.style.cssText = `color: ${mentionColor}; font-weight: 600; cursor: pointer;`;
    mentionSpan.textContent = `@${user.name}`;
    mentionSpan.dataset.userId = user.id;
    mentionSpan.dataset.userName = user.name;

    // Rebuild editor content
    editorRef.current.innerHTML = "";

    if (beforeText) {
      editorRef.current.appendChild(document.createTextNode(beforeText));
    }

    editorRef.current.appendChild(mentionSpan);

    // Add a zero-width space followed by regular space after the mention
    const spaceNode = document.createTextNode("\u200B ");
    editorRef.current.appendChild(spaceNode);

    if (afterText) {
      editorRef.current.appendChild(document.createTextNode(afterText));
    }

    setMentions((prev) => [...prev, { id: user.id, name: user.name }]);

    // Focus editor and set cursor after the zero-width space + space
    editorRef.current.focus();

    // Place cursor at position 2 (after zero-width space and regular space)
    selection.collapse(spaceNode, 2);

    setShowMentions(false);

    // Log final content
    setTimeout(() => {
      console.log("[ChatInput] After mention, plainText:", getPlainText());
    }, 0);
  };

  const handleSend = () => {
    const content = getPlainText().trim();
    if (content || selectedFiles.length > 0) {
      if (onSend) {
        onSend(content, replyTo, selectedFiles);
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
        setMentions([]);
        setSelectedFiles([]);
        setIsEmpty(true);
      }
      setShowMentions(false);
      if (onStopTyping) onStopTyping();
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = [];
    const nonImageFiles = [];

    files.forEach((file) => {
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert(
          `File "${file.name}" có định dạng không được hỗ trợ. Chỉ chấp nhận file PDF và hình ảnh.`,
        );
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" vượt quá kích thước tối đa (10MB).`);
        return;
      }

      // Separate images (async) from non-images (sync)
      if (file.type.startsWith("image/")) {
        imageFiles.push(file);
      } else {
        nonImageFiles.push({
          file,
          name: file.name,
          type: file.type,
          size: file.size,
          preview: null,
        });
      }
    });

    // Add non-image files immediately
    if (nonImageFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...nonImageFiles]);
    }

    // Process images asynchronously with Promise.all
    if (imageFiles.length > 0) {
      Promise.all(
        imageFiles.map(
          (file) =>
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve({
                  file,
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  preview: e.target.result,
                });
              };
              reader.readAsDataURL(file);
            }),
        ),
      ).then((imageResults) => {
        setSelectedFiles((prev) => [...prev, ...imageResults]);
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove selected file
  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Trigger file input click
  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e) => {
    if (showMentions) {
      const filteredUsers = allUsers.filter((user) =>
        user.name.toLowerCase().includes(mentionFilter.toLowerCase()),
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedMentionIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : prev,
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }

      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        if (filteredUsers[selectedMentionIndex]) {
          handleMentionSelect(filteredUsers[selectedMentionIndex]);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setShowMentions(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    if (e.key === "Backspace") {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const cursorOffset = getCursorOffset();

      if (cursorOffset > 0 && range.startOffset === 0) {
        const prevNode = range.startContainer.previousSibling;
        if (
          prevNode &&
          prevNode.classList &&
          prevNode.classList.contains("mention-tag")
        ) {
          e.preventDefault();
          prevNode.remove();
          setMentions((prev) =>
            prev.filter((m) => m.id !== prevNode.dataset.userId),
          );
          return;
        }
      }

      if (cursorOffset > 0) {
        const plainText = getPlainText();
        const charBeforeCursor = plainText[cursorOffset - 1];

        if (charBeforeCursor === " ") {
          const textBeforeSpace = plainText.substring(0, cursorOffset - 1);
          const lastAtPos = textBeforeSpace.lastIndexOf("@");
          if (lastAtPos >= 0) {
            const potentialMention = textBeforeSpace.substring(lastAtPos);
            const mentionedUser = allUsers.find(
              (u) =>
                `@${u.name} ` === potentialMention ||
                `@${u.name}` === potentialMention,
            );
            if (mentionedUser) {
              e.preventDefault();
              const beforeMention = plainText.substring(0, lastAtPos);
              const afterMention = plainText.substring(cursorOffset);
              editorRef.current.innerHTML = "";
              if (beforeMention) {
                editorRef.current.appendChild(
                  document.createTextNode(beforeMention),
                );
              }
              if (afterMention) {
                editorRef.current.appendChild(
                  document.createTextNode(afterMention),
                );
              }
              const newRange = document.createRange();
              const textNode = editorRef.current.lastChild || editorRef.current;
              newRange.setStart(textNode, beforeMention.length);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
              setMentions((prev) =>
                prev.filter((m) => m.id !== mentionedUser.id),
              );
              return;
            }
          }
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="border-t shrink-0 relative"
      style={{
        borderColor: "var(--border-primary)",
        background: "var(--bg-surface-secondary)",
      }}
    >
      {/* Typing indicator — nằm TRÊN box input, absolute position */}
      {typingSender && (
        <div className="absolute top-[-28px] left-0 flex items-center gap-2 px-4 pt-2 pb-1">
          <span className="text-xs italic" style={{ color: "var(--primary)" }}>
            {typingSender === 'StudyBot' ? `${typingSender} đang suy nghĩ...` : `${typingSender} đang nhập`}
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
      )}

      <div className="px-4 py-3">
        {/* File attachment preview */}
        {selectedFiles.length > 0 && (
          <FileAttachmentPreview
            files={selectedFiles}
            onRemove={handleRemoveFile}
            isDark={isDark}
          />
        )}

        {showMentions && (
          <div
            className="absolute bottom-full left-4 right-4 mb-2 rounded-lg shadow-lg border overflow-hidden z-50"
            style={{
              background: isDark ? "var(--bg-surface-secondary)" : "#fff",
              borderColor: "var(--border-primary)",
            }}
          >
            <MentionSuggestions
              onSelect={handleMentionSelect}
              isDark={isDark}
              filterText={mentionFilter}
              selectedIndex={selectedMentionIndex}
            />
          </div>
        )}

        <div
          className={`chat-input-wrapper border rounded-lg p-1 transition-colors relative ${disabled ? "opacity-50" : ""}`}
          style={{
            background: "var(--input-bg)",
            borderColor: "var(--input-border)",
          }}
          onFocus={(e) =>
            !disabled && (e.currentTarget.style.borderColor = "var(--primary)")
          }
          onBlur={(e) =>
            !disabled && (e.currentTarget.style.borderColor = "var(--input-border)")
          }
        >
          <div className="flex items-center gap-2">
            <div
              className={`chat-input-placeholder ${isEmpty ? "" : "hidden"}`}
            >
              {disabled ? "Chọn một cuộc trò chuyện để bắt đầu" : placeholderText}
            </div>
            <div
              ref={editorRef}
              contentEditable={!disabled}
              className="flex-1 border-none bg-transparent px-3 py-2 text-sm outline-none font-sans min-h-9 max-h-32 overflow-y-auto relative z-10"
              style={{
                color: "var(--input-text)",
              }}
              onInput={disabled ? undefined : handleInput}
              onKeyDown={disabled ? undefined : handleKeyDown}
              suppressContentEditableWarning
            />
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={disabled}
            />
            <button
              type="button"
              disabled={disabled}
              className="w-9 h-9 border-none rounded-md cursor-pointer flex items-center justify-center transition-colors disabled:cursor-not-allowed"
              style={{
                background: "transparent",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) =>
                !disabled && (e.currentTarget.style.background = "var(--hover-primary)")
              }
              onMouseLeave={(e) =>
                !disabled && (e.currentTarget.style.background = "transparent")
              }
              onClick={handleAttachmentClick}
              title="Đính kèm file (PDF, hình ảnh)"
            >
              <FiPaperclip size={18} />
            </button>
            <button
              type="button"
              disabled={disabled}
              className="w-9 h-9 border-none rounded-md cursor-pointer flex items-center justify-center transition-colors disabled:cursor-not-allowed"
              style={{
                background: "var(--primary)",
                color: isDark ? "var(--bg-surface)" : "#fff",
              }}
              onMouseEnter={(e) =>
                !disabled && (e.currentTarget.style.background = "var(--primary-hover)")
              }
              onMouseLeave={(e) =>
                !disabled && (e.currentTarget.style.background = "var(--primary)")
              }
              onClick={handleSend}
              title="Gửi"
            >
              <IoSend size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
