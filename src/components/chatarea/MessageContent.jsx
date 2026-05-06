import { getUserColor } from "../../utils/userColor.js";

/**
 * Render message content with @ mentions as styled tags
 * Uses a simple color hash for unknown users instead of mock data
 */
export function renderMessageWithMentions(content, isDark, onShowProfile, isBot = false) {
  if (!content) return content;

  // Regex to match @username patterns (only letters, numbers, underscores - no spaces)
  const mentionRegex = /@([a-zA-Z0-9À-ỹ_]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex, match.index)}
        </span>,
      );
    }

    // Extract the mentioned name
    const mentionedName = match[1].trim();

    // Get color for the mentioned user using the name-based hash
    const mentionColor = getUserColor(mentionedName);

    // Render the mention as colored text
    parts.push(
      <span
        key={`mention-${match.index}`}
        className="font-semibold cursor-pointer"
        style={{
          color: mentionColor,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onShowProfile) {
            onShowProfile(mentionedName);
          }
        }}
      >
        @{mentionedName}
      </span>,
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-end-${lastIndex}`}>{content.substring(lastIndex)}</span>,
    );
  }

  return parts.length > 0 ? parts : content;
}
