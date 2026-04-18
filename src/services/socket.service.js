import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // Connect to WebSocket server
  connect() {
    if (this.socket?.connected) return;

    const token = localStorage.getItem("authToken");
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }

  // Disconnect from WebSocket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a room
  joinRoom(roomId) {
    this.socket?.emit("joinRoom", roomId);
  }

  // Leave a room
  leaveRoom(roomId) {
    this.socket?.emit("leaveRoom", roomId);
  }

  // Send message via socket
  sendMessage(data) {
    this.socket?.emit("sendMessage", data);
  }

  // Update online status
  updateStatus(status) {
    this.socket?.emit("updateStatus", status);
  }

  // ==================== Message Events ====================

  // Listen for new message
  onNewMessage(callback) {
    this.socket?.on("newMessage", callback);
  }

  // Listen for message deleted
  onMessageDeleted(callback) {
    this.socket?.on("messageDeleted", callback);
  }

  // Listen for message updated/edited
  onMessageUpdated(callback) {
    this.socket?.on("messageUpdated", callback);
  }

  // Listen for message pinned
  onMessagePinned(callback) {
    this.socket?.on("messagePinned", callback);
  }

  // Listen for message unpinned
  onMessageUnpinned(callback) {
    this.socket?.on("messageUnpinned", callback);
  }

  // Listen for reaction added
  onReactionAdded(callback) {
    this.socket?.on("reactionAdded", callback);
  }

  // Listen for reaction removed
  onReactionRemoved(callback) {
    this.socket?.on("reactionRemoved", callback);
  }

  // ==================== Typing Events ====================

  // Listen for typing indicator
  onTyping(callback) {
    this.socket?.on("typing", callback);
  }

  // Listen for stop typing
  onStopTyping(callback) {
    this.socket?.on("stopTyping", callback);
  }

  // Emit typing event
  emitTyping(roomId) {
    this.socket?.emit("typing", roomId);
  }

  // Emit stop typing event
  emitStopTyping(roomId) {
    this.socket?.emit("stopTyping", roomId);
  }

  // ==================== Room/Space Events ====================

  // Listen for user joined
  onUserJoined(callback) {
    this.socket?.on("userJoined", callback);
  }

  // Listen for user left
  onUserLeft(callback) {
    this.socket?.on("userLeft", callback);
  }

  // Listen for member joined space
  onMemberJoinedSpace(callback) {
    this.socket?.on("memberJoinedSpace", callback);
  }

  // Listen for member left space
  onMemberLeftSpace(callback) {
    this.socket?.on("memberLeftSpace", callback);
  }

  // Listen for room created
  onRoomCreated(callback) {
    this.socket?.on("roomCreated", callback);
  }

  // Listen for room updated
  onRoomUpdated(callback) {
    this.socket?.on("roomUpdated", callback);
  }

  // Listen for room deleted
  onRoomDeleted(callback) {
    this.socket?.on("roomDeleted", callback);
  }

  // ==================== User Status Events ====================

  // Listen for user online status change
  onUserStatusChanged(callback) {
    this.socket?.on("userStatusChanged", callback);
  }

  // Listen for user profile updated
  onUserProfileUpdated(callback) {
    this.socket?.on("userProfileUpdated", callback);
  }

  // ==================== DM Events ====================

  // Listen for new DM message
  onNewDM(callback) {
    this.socket?.on("newDM", callback);
  }

  // Listen for DM read receipt
  onDMRead(callback) {
    this.socket?.on("dmRead", callback);
  }

  // ==================== Notification Events ====================

  // Listen for notification
  onNotification(callback) {
    this.socket?.on("notification", callback);
  }

  // Listen for unread count update
  onUnreadCountUpdate(callback) {
    this.socket?.on("unreadCountUpdate", callback);
  }

  // ==================== File Events ====================

  // Listen for file upload progress
  onFileUploadProgress(callback) {
    this.socket?.on("fileUploadProgress", callback);
  }

  // Listen for file upload complete
  onFileUploadComplete(callback) {
    this.socket?.on("fileUploadComplete", callback);
  }

  // Listen for file upload error
  onFileUploadError(callback) {
    this.socket?.on("fileUploadError", callback);
  }

  // ==================== Listener Management ====================

  // Remove specific listener
  off(event, callback) {
    this.socket?.off(event, callback);
  }

  // Remove all listeners for an event
  offEvent(event) {
    this.socket?.off(event);
  }

  // Remove all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getId() {
    return this.socket?.id || null;
  }
}

export default new SocketService();
