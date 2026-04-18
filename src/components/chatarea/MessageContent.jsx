import { dmUsers } from "../../data/mockData.js";
import { getUserColor } from "../../utils/userColor.js";

/**
 * Render message content with @ mentions as styled tags
 */
export function renderMessageWithMentions(content, isDark, onShowProfile) {
  if (!content) return content;

  // Regex to match @username patterns (only letters, numbers, underscores - no spaces)
  const mentionRegex = /@([a-zA-Z0-9À-ỹ_]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  // Create a map of user names to their data for quick lookup
  const userMap = {};
  dmUsers.forEach((user) => {
    userMap[user.name.toLowerCase()] = user;
  });

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
    const userData = userMap[mentionedName.toLowerCase()];

    // Get color for the mentioned user
    const mentionColor = userData ? getUserColor(userData.name) : "#74c0fc";

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
          if (userData && onShowProfile) {
            onShowProfile(userData.name);
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
