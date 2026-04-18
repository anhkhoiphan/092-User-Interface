import { usernameColors, fallbackColors } from "../constants/usernameColors";

// Build map from Vietnamese color names to hex codes
const colorNameMap = Object.fromEntries(
  usernameColors.map((c) => [c.name, c.hex])
);

/**
 * Generate a consistent color for a username
 * @param {string} name - The username
 * @param {string} [colorName] - Optional custom color name from user profile
 * @returns {string} Hex color code
 */
export function getUserColor(name, colorName) {
  // Check if user has set a custom color for "You"
  if (name === "You") {
    const savedColor = localStorage.getItem("usernameColor");
    if (savedColor) return colorNameMap[savedColor] || savedColor;
  }

  // Use the color name from user profile if available
  if (colorName) {
    return colorNameMap[colorName] || colorName;
  }

  // Generate a hash-based color for consistent assignment
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % fallbackColors.length;
  return fallbackColors[index];
}
