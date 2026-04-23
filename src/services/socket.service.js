import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this._connected = false;
    this._activeDMRooms = new Set();
  }

  // ==================== Connection ====================

  connect() {
    if (this.socket?.connected) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      // No access token, skipping connect
      return;
    }

    // Connecting with token

    this.socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      // Socket connected
      this._connected = true;
    });

    this.socket.on("disconnect", (reason) => {
      // Socket disconnected
      this._connected = false;
    });

    this.socket.on("connect_error", (error) => {
      // Socket connect error
    });

    this.socket.on("reconnect", (attemptNumber) => {
      // Socket reconnected - re-join active DM rooms
      this._activeDMRooms.forEach((conversationId) => {
        this.joinDM(conversationId);
      });
    });

    this.socket.on("reconnect_error", (error) => {
      // Socket reconnection error
    });

    this.socket.on("error", (error) => {
      // Socket error
    });

    // Connection ack from server
    this.socket.on("connected", (data) => {
      // Socket server ack
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._connected = false;
    }
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
    const payload = { conversationId, content };
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
    this.socket?.emit("joinRoom", roomId);
  }

  leaveRoom(roomId) {
    this.socket?.emit("leaveRoom", roomId);
  }

  sendMessage(data) {
    this.socket?.emit("sendMessage", data);
  }

  updateStatus(status) {
    this.socket?.emit("updateStatus", status);
  }

  emitTyping(roomId) {
    this.socket?.emit("typing", roomId);
  }

  emitStopTyping(roomId) {
    this.socket?.emit("stopTyping", roomId);
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
