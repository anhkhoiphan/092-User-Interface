import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this._connected = false;
    this._activeDMRooms = new Set();
    this._activeRooms = new Set();
    this._joinedRooms = new Set(); // Rooms that have received 'joinedRoom' ack
  }

  // ==================== Connection ====================

  connect() {
    if (this.socket?.connected) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      return;
    }

    this.socket = io(`${SOCKET_URL}/chat`, {
      // Use auth callback so socket.io reads fresh token on every connect/reconnect
      auth: (cb) => {
        cb({ token: localStorage.getItem("access_token") });
      },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("[Socket] Connected:", this.socket.id);
      this._connected = true;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      this._connected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("[Socket] Connect error:", error.message);
      // If auth failed due to expired token, try to trigger a token refresh
      // by making a dummy API call. The axios interceptor will handle 401.
      if (error.message?.includes("jwt expired") || error.message?.includes("auth")) {
        this._handleAuthError();
      }
    });

    this.socket.on("reconnect", async (attemptNumber) => {
      console.log("[Socket] Reconnected after", attemptNumber, "attempts");
      // Re-join all active rooms with fresh token
      this._activeDMRooms.forEach((conversationId) => {
        this.joinDM(conversationId);
      });
      // Await room joins to ensure server is ready before sending
      const roomJoinPromises = Array.from(this._activeRooms).map((roomId) =>
        this.joinRoom(roomId).catch((err) => {
          console.warn("[Socket] Failed to rejoin room:", roomId, err);
        }),
      );
      await Promise.all(roomJoinPromises);
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("[Socket] Reconnect error:", error.message);
    });

    this.socket.on("error", (error) => {
      console.error("[Socket] Error:", error);
    });

    this.socket.on("connected", (data) => {
      console.log("[Socket] Server ack:", data);
    });
  }

  // Trigger a token refresh by making a lightweight API call.
  // The axios response interceptor will handle 401 and refresh the token.
  _handleAuthError() {
    console.log("[Socket] Token may be expired, triggering refresh via API...");
    // Use a lightweight endpoint to trigger the refresh flow
    // The access token will be updated in localStorage by the interceptor
    import("./api").then(({ default: api }) => {
      api.get("/users/me").catch(() => {
        // Expected to fail or succeed; either way, token may have been refreshed
      });
    });
  }

  // Reconnect with fresh token. Call this after token refresh succeeds.
  reconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connect();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._connected = false;
    this._activeDMRooms.clear();
    this._activeRooms.clear();
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getId() {
    return this.socket?.id || null;
  }

  // ==================== DM Room Events ====================

  joinDM(conversationId) {
    if (!conversationId) return;
    this._activeDMRooms.add(conversationId);
    this.socket?.emit("joinDM", { conversationId });
  }

  leaveDM(conversationId) {
    if (!conversationId) return;
    this._activeDMRooms.delete(conversationId);
    this.socket?.emit("leaveDM", { conversationId });
  }

  sendDM(conversationId, content, tempId) {
    if (!conversationId) return;
    const clientSentAt = Date.now();
    const payload = { conversationId, content, clientSentAt };
    if (tempId) payload.tempId = tempId;
    this.socket?.emit("sendDM", payload);
  }

  dmTyping(conversationId, isTyping) {
    this.socket?.emit("dmTyping", { conversationId, isTyping });
  }

  markDMRead(conversationId) {
    this.socket?.emit("markDMRead", { conversationId });
  }

  // ==================== Status Events ====================

  setStatus(status) {
    this.socket?.emit("setStatus", { status });
  }

  getOnlineUsers() {
    this.socket?.emit("getOnlineUsers");
  }

  // ==================== Notification Events ====================

  markNotificationRead(notificationId) {
    this.socket?.emit("markNotificationRead", { notificationId });
  }

  getUnreadCount() {
    this.socket?.emit("getUnreadCount");
  }

  // ==================== Room/Space Events (legacy) ====================

  joinRoom(roomId) {
    if (!roomId) return Promise.resolve();
    this._activeRooms.add(roomId);
    return new Promise((resolve) => {
      // Fast timeout — don't block UI if server is slow to ack
      const timeout = setTimeout(() => {
        this.socket?.off("joinedRoom", onJoined);
        this._joinedRooms.add(roomId); // Allow sending anyway
        console.warn("[Socket] joinRoom timeout, allowing sends for:", roomId);
        resolve({ roomId, timeout: true });
      }, 1500);
      const onJoined = (data) => {
        if (data?.roomId === roomId) {
          clearTimeout(timeout);
          this.socket?.off("joinedRoom", onJoined);
          this._joinedRooms.add(roomId);
          console.log("[Socket] Joined room:", roomId);
          resolve(data);
        }
      };
      this.socket?.on("joinedRoom", onJoined);
      this.socket?.emit("joinRoom", { roomId });
    });
  }

  leaveRoom(roomId) {
    if (!roomId) return;
    this._activeRooms.delete(roomId);
    this._joinedRooms.delete(roomId);
    this.socket?.emit("leaveRoom", { roomId });
  }

  sendMessage(data) {
    const { roomId } = data;
    // Auto-join if not yet acked but is active room (don't block send)
    if (roomId && !this._joinedRooms.has(roomId)) {
      if (this._activeRooms.has(roomId)) {
        console.warn("[Socket] Room not yet acked, allowing send anyway:", roomId);
      } else {
        console.warn("[Socket] Cannot send message - not in active rooms:", roomId);
        return;
      }
    }
    this.socket?.emit("sendMessage", data);
  }

  updateStatus(status) {
    this.socket?.emit("updateStatus", status);
  }

  emitTyping(roomId) {
    if (roomId && !this._activeRooms.has(roomId)) {
      console.warn("[Socket] Cannot emit typing - not active room:", roomId);
      return;
    }
    this.socket?.emit("typing", { roomId });
  }

  emitStopTyping(roomId) {
    if (roomId && !this._activeRooms.has(roomId)) {
      console.warn("[Socket] Cannot emit stopTyping - not active room:", roomId);
      return;
    }
    this.socket?.emit("stopTyping", { roomId });
  }

  // ==================== Listener Management ====================

  on(event, callback) {
    this.socket?.on(event, callback);
  }

  off(event, callback) {
    this.socket?.off(event, callback);
  }

  offEvent(event) {
    this.socket?.off(event);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  // ==================== DM-specific Listeners ====================

  onJoinedDM(callback) {
    this.socket?.on("joinedDM", callback);
  }

  onLeftDM(callback) {
    this.socket?.on("leftDM", callback);
  }

  onNewDM(callback) {
    this.socket?.on("newDM", callback);
  }

  onDmSent(callback) {
    this.socket?.on("dmSent", callback);
  }

  onDmTyping(callback) {
    this.socket?.on("dmTyping", callback);
  }

  onDmRead(callback) {
    this.socket?.on("dmRead", callback);
  }

  onDmMarkedRead(callback) {
    this.socket?.on("dmMarkedRead", callback);
  }

  // ==================== User Status Listeners ====================

  onUserStatusChanged(callback) {
    this.socket?.on("userStatusChanged", callback);
  }

  onStatusSet(callback) {
    this.socket?.on("statusSet", callback);
  }

  onOnlineUsers(callback) {
    this.socket?.on("onlineUsers", callback);
  }

  onConnected(callback) {
    this.socket?.on("connected", callback);
  }

  // ==================== Notification Listeners ====================

  onNewNotification(callback) {
    this.socket?.on("newNotification", callback);
  }

  onNotificationsMarkedRead(callback) {
    this.socket?.on("notificationsMarkedRead", callback);
  }

  onUnreadCountUpdate(callback) {
    this.socket?.on("unreadCount", callback);
  }

  // ==================== Legacy Listeners ====================

  onNewMessage(callback) {
    this.socket?.on("newMessage", callback);
  }

  onMessageSent(callback) {
    this.socket?.on("messageSent", callback);
  }

  onMessageDeleted(callback) {
    this.socket?.on("messageDeleted", callback);
  }

  onMessageUpdated(callback) {
    this.socket?.on("messageUpdated", callback);
  }

  onMessagePinned(callback) {
    this.socket?.on("messagePinned", callback);
  }

  onMessageUnpinned(callback) {
    this.socket?.on("messageUnpinned", callback);
  }

  onReactionAdded(callback) {
    this.socket?.on("reactionAdded", callback);
  }

  onReactionRemoved(callback) {
    this.socket?.on("reactionRemoved", callback);
  }

  onTyping(callback) {
    this.socket?.on("typing", callback);
  }

  onStopTyping(callback) {
    this.socket?.on("stopTyping", callback);
  }

  onUserJoined(callback) {
    this.socket?.on("userJoined", callback);
  }

  onUserLeft(callback) {
    this.socket?.on("userLeft", callback);
  }

  onMemberJoinedSpace(callback) {
    this.socket?.on("memberJoinedSpace", callback);
  }

  onMemberLeftSpace(callback) {
    this.socket?.on("memberLeftSpace", callback);
  }

  onRoomCreated(callback) {
    this.socket?.on("roomCreated", callback);
  }

  onRoomUpdated(callback) {
    this.socket?.on("roomUpdated", callback);
  }

  onRoomDeleted(callback) {
    this.socket?.on("roomDeleted", callback);
  }

  onUserProfileUpdated(callback) {
    this.socket?.on("userProfileUpdated", callback);
  }

  onNotification(callback) {
    this.socket?.on("notification", callback);
  }

  onFileUploadProgress(callback) {
    this.socket?.on("fileUploadProgress", callback);
  }

  onFileUploadComplete(callback) {
    this.socket?.on("fileUploadComplete", callback);
  }

  onFileUploadError(callback) {
    this.socket?.on("fileUploadError", callback);
  }
}

export default new SocketService();
