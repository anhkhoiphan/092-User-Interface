# Users API - Hướng dẫn cho FE

## Base URL
```
/users
```

> **Lưu ý:** Tất cả API đều yêu cầu `Authorization: Bearer <accessToken>`

---

## 1. Search users

```http
GET /users/search?q={query}&limit={limit}&offset={offset}
```

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `q` | string | - | Từ khóa tìm kiếm (displayName hoặc email) |
| `limit` | number | 20 | Số kết quả tối đa (1-50) |
| `offset` | number | 0 | Vị trí bắt đầu |

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "Tên hiển thị",
      "avatar_url": "https://...",
      "bio": "...",
      "created_at": "2026-04-10T...",
      "updated_at": "2026-04-10T..."
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

---

## 2. Get user by ID

```http
GET /users/:userId
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "Tên hiển thị",
  "avatar_url": "https://...",
  "bio": "...",
  "created_at": "2026-04-10T...",
  "updated_at": "2026-04-10T..."
}
```

---

## 3. Get user online status

```http
GET /users/:userId/status
```

**Response:**
```json
{
  "online": true,
  "lastSeen": "2026-04-16T15:30:00.000Z"
}
```

> `lastSeen` có thể `null` nếu chưa có dữ liệu.

---

## WebSocket - User Status (Realtime)

Khi FE kết nối WSS (`namespace: /chat`), server tự động:
- Đánh dấu user `online`
- Broadcast `userStatusChanged` đến các client khác

### Lắng nghe event:

```ts
socket.on('connected', (data) => {
  // data: { socketId, userId, onlineUsers: string[], timestamp }
});

socket.on('userStatusChanged', (data) => {
  // data: { userId, status: 'online' | 'offline' }
});
```

---

## Tóm tắt

| Chức năng | API/WS | Cần auth |
|-----------|--------|----------|
| Tìm kiếm user | `GET /users/search` | ✅ |
| Xem profile user | `GET /users/:userId` | ✅ |
| Xem status user | `GET /users/:userId/status` | ✅ |
| Realtime online/offline | WSS events | ✅ |
