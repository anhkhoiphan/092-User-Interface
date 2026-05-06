/**
 * Message Cache Utility
 * Lưu messages và conversations vào localStorage để hiển thị ngay lập tức (stale-while-revalidate)
 */

const CACHE_PREFIX = "vc_msgs_";
const CONV_CACHE_KEY = `${CACHE_PREFIX}conversations`;
const SPACES_CACHE_KEY = `${CACHE_PREFIX}spaces`;
const MEMBERS_CACHE_KEY = `${CACHE_PREFIX}members`;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 50; // Giới hạn số conversation/room được cache

function getKey(type, id) {
  return `${CACHE_PREFIX}${type}_${id}`;
}

/**
 * Get cached messages for a conversation or room
 * @param {'dm' | 'room'} type
 * @param {string} id - conversationId or roomId
 * @returns {{ messages: Array, fetchedAt: number, page: number } | null}
 */
export function getCachedMessages(type, id) {
  if (!id) return null;
  try {
    const raw = localStorage.getItem(getKey(type, id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate structure
    if (!Array.isArray(parsed.messages)) return null;
    return {
      messages: parsed.messages,
      fetchedAt: parsed.fetchedAt || 0,
      page: parsed.page || 1,
    };
  } catch {
    return null;
  }
}

/**
 * Save messages to cache
 * @param {'dm' | 'room'} type
 * @param {string} id
 * @param {Array} messages
 * @param {number} page
 */
export function setCachedMessages(type, id, messages, page = 1) {
  if (!id || !Array.isArray(messages)) return;
  try {
    // Enforce max entries: remove oldest if exceeded
    enforceMaxEntries();

    const payload = {
      messages,
      fetchedAt: Date.now(),
      page,
    };
    localStorage.setItem(getKey(type, id), JSON.stringify(payload));
  } catch (err) {
    // localStorage might be full — clear old caches
    if (err.name === "QuotaExceededError") {
      clearOldestCaches(10);
      try {
        const payload = {
          messages,
          fetchedAt: Date.now(),
          page,
        };
        localStorage.setItem(getKey(type, id), JSON.stringify(payload));
      } catch {
        // Still full, skip caching
      }
    }
  }
}

/**
 * Check if cache is still valid (within TTL)
 * @param {'dm' | 'room'} type
 * @param {string} id
 * @param {number} ttlMs
 * @returns {boolean}
 */
export function isCacheValid(type, id, ttlMs = DEFAULT_TTL_MS) {
  const cached = getCachedMessages(type, id);
  if (!cached) return false;
  return Date.now() - cached.fetchedAt < ttlMs;
}

/**
 * Check if cache exists (regardless of TTL)
 * @param {'dm' | 'room'} type
 * @param {string} id
 * @returns {boolean}
 */
export function hasCache(type, id) {
  return getCachedMessages(type, id) !== null;
}

/**
 * Clear cache for a specific conversation/room
 * @param {'dm' | 'room'} type
 * @param {string} id
 */
export function clearCache(type, id) {
  if (!id) return;
  try {
    localStorage.removeItem(getKey(type, id));
  } catch {
    // ignore
  }
}

/**
 * Clear all message caches (including conversations)
 */
export function clearAllMessageCaches() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

// Helper: enforce max cache entries
function enforceMaxEntries() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw);
        entries.push({ key, fetchedAt: parsed.fetchedAt || 0 });
      } catch {
        // ignore invalid entries
      }
    }
  }
  if (entries.length > MAX_CACHE_ENTRIES) {
    // Sort by fetchedAt ascending (oldest first)
    entries.sort((a, b) => a.fetchedAt - b.fetchedAt);
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
    toRemove.forEach((e) => localStorage.removeItem(e.key));
  }
}

// ==================== Conversations Cache ====================

/**
 * Get cached conversations list
 * @returns {{ conversations: Array, fetchedAt: number } | null}
 */
export function getCachedConversations() {
  try {
    const raw = localStorage.getItem(CONV_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.conversations)) return null;
    return {
      conversations: parsed.conversations,
      fetchedAt: parsed.fetchedAt || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Save conversations list to cache
 * @param {Array} conversations
 */
export function setCachedConversations(conversations) {
  if (!Array.isArray(conversations)) return;
  try {
    const payload = {
      conversations,
      fetchedAt: Date.now(),
    };
    localStorage.setItem(CONV_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    if (err.name === "QuotaExceededError") {
      clearAllMessageCaches();
      try {
        localStorage.setItem(CONV_CACHE_KEY, JSON.stringify({
          conversations,
          fetchedAt: Date.now(),
        }));
      } catch {
        // skip
      }
    }
  }
}

/**
 * Check if conversations cache is valid
 * @param {number} ttlMs
 * @returns {boolean}
 */
export function isConversationsCacheValid(ttlMs = DEFAULT_TTL_MS) {
  const cached = getCachedConversations();
  if (!cached) return false;
  return Date.now() - cached.fetchedAt < ttlMs;
}

/**
 * Check if conversations cache exists
 * @returns {boolean}
 */
export function hasConversationsCache() {
  return getCachedConversations() !== null;
}

// ==================== Spaces & Rooms Cache ====================

/**
 * Get cached spaces and roomsMap
 * @returns {{ spaces: Array, roomsMap: Object, fetchedAt: number } | null}
 */
export function getCachedSpaces() {
  try {
    const raw = localStorage.getItem(SPACES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.spaces)) return null;
    return {
      spaces: parsed.spaces,
      roomsMap: parsed.roomsMap || {},
      fetchedAt: parsed.fetchedAt || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Save spaces and roomsMap to cache
 * @param {Array} spaces
 * @param {Object} roomsMap
 */
export function setCachedSpaces(spaces, roomsMap) {
  if (!Array.isArray(spaces)) return;
  try {
    const payload = {
      spaces,
      roomsMap: roomsMap || {},
      fetchedAt: Date.now(),
    };
    localStorage.setItem(SPACES_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    if (err.name === "QuotaExceededError") {
      clearAllMessageCaches();
      try {
        localStorage.setItem(SPACES_CACHE_KEY, JSON.stringify({
          spaces,
          roomsMap: roomsMap || {},
          fetchedAt: Date.now(),
        }));
      } catch {
        // skip
      }
    }
  }
}

/**
 * Check if spaces cache exists
 * @returns {boolean}
 */
export function hasSpacesCache() {
  return getCachedSpaces() !== null;
}

// ==================== Members Cache ====================

/**
 * Get cached membersMap
 * @returns {{ membersMap: Object, fetchedAt: number } | null}
 */
export function getCachedMembers() {
  try {
    const raw = localStorage.getItem(MEMBERS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      membersMap: parsed.membersMap || {},
      fetchedAt: parsed.fetchedAt || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Save membersMap to cache
 * @param {Object} membersMap
 */
export function setCachedMembers(membersMap) {
  if (!membersMap || typeof membersMap !== "object") return;
  try {
    const payload = {
      membersMap,
      fetchedAt: Date.now(),
    };
    localStorage.setItem(MEMBERS_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    if (err.name === "QuotaExceededError") {
      clearAllMessageCaches();
      try {
        localStorage.setItem(MEMBERS_CACHE_KEY, JSON.stringify({
          membersMap,
          fetchedAt: Date.now(),
        }));
      } catch {
        // skip
      }
    }
  }
}

/**
 * Check if members cache exists
 * @returns {boolean}
 */
export function hasMembersCache() {
  return getCachedMembers() !== null;
}

// Helper: clear N oldest caches
function clearOldestCaches(count) {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw);
        entries.push({ key, fetchedAt: parsed.fetchedAt || 0 });
      } catch {
        // ignore
      }
    }
  }
  entries.sort((a, b) => a.fetchedAt - b.fetchedAt);
  entries.slice(0, count).forEach((e) => localStorage.removeItem(e.key));
}
