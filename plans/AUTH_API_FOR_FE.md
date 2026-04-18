# Tài liệu tích hợp Auth API — Dành cho Frontend

> **Cơ chế xác thực:** JWT Access Token + Refresh Token  
> **Prefix API:** `/auth`  
> **Swagger (local):** `http://localhost:3000/api`

---

## 1. Cơ chế token

Hệ thống sử dụng **cặp token**:

| Token | Thờii hạn | Dùng để | Lưu ở đâu (FE) |
|---|---|---|---|
| **Access Token** | 15 phút | Gửi kèm mọi API được bảo vệ | `memory` (React state / context) hoặc `sessionStorage` |
| **Refresh Token** | 7 ngày | Lấy access token mới khi hết hạn | `httpOnly cookie` hoặc `localStorage` (tùy chọn, nhưng cookie an toàn hơn) |

### Luồng chuẩn
1. **Đăng nhập** → nhận `accessToken` + `refreshToken`
2. FE gửi `accessToken` qua header `Authorization: Bearer <token>` với mọi request cần auth
3. Khi server trả `401` → FE gọi `POST /auth/refresh` để đổi `refreshToken` lấy cặp token mới
4. Khi user ấn **Đăng xuất** → FE gọi `POST /auth/logout` và xóa token ở client

---

## 2. API Endpoints

### 2.1 Đăng ký tài khoản
```http
POST /auth/register
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "displayName": "Nguyễn Văn A",
  "avatar": "https://cdn.example.com/avatar.jpg"
}
```
> `avatar` là optional.

**Response 201:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "displayName": "Nguyễn Văn A",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "bio": null,
    "status": "offline",
    "lastSeen": "2026-04-15T12:00:00.000Z",
    "createdAt": "2026-04-15T12:00:00.000Z",
    "updatedAt": "2026-04-15T12:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "expiresIn": 900
}
```
> `expiresIn` tính bằng giây (900s = 15 phút).

**Lỗi thường gặp:**
- `409 Conflict` — Email đã được đăng ký
- `400 Bad Request` — Dữ liệu không hợp lệ (password < 6 ký tự, displayName < 2 ký tự, email sai định dạng)

---

### 2.2 Đăng nhập
```http
POST /auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response 200:**
```json
{
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "expiresIn": 900
}
```

**Lỗi thường gặp:**
- `401 Unauthorized` — Sai email hoặc mật khẩu
- `429 Too Many Requests` — Đăng nhập sai quá 5 lần/giờ từ cùng 1 IP

---

### 2.3 Refresh token
Dùng khi access token hết hạn hoặc bị revoke.

```http
POST /auth/refresh
Content-Type: application/json
```

**Body:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhbiBldmVuLW5ld2VyLXJlZnJlc2g...",
  "expiresIn": 900
}
```
> **Mỗi lần refresh sẽ sinh refresh token hoàn toàn mới.** FE nhớ cập nhật cả 2 token.

**Lỗi thường gặp:**
- `401 Unauthorized` — Refresh token không hợp lệ, đã hết hạn, hoặc đã bị sử dụng (logout/đổi mật khẩu)

---

### 2.4 Đăng xuất
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Body:** Không có.

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

> Sau khi logout, access token và refresh token cũ đều **vĩnh viễn không dùng lại được**.

---

### 2.5 Lấy profile của mình
```http
GET /auth/profile
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "displayName": "Nguyễn Văn A",
    "avatar": "https://cdn.example.com/avatar.jpg",
    "bio": "Hello world",
    "status": "online",
    "lastSeen": "2026-04-15T12:30:00.000Z",
    "createdAt": "2026-04-15T12:00:00.000Z",
    "updatedAt": "2026-04-15T12:30:00.000Z"
  }
}
```

---

### 2.6 Cập nhật profile của mình
```http
PATCH /auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:** (tất cả fields đều optional)
```json
{
  "displayName": "Tên mới",
  "avatar": "https://cdn.example.com/new-avatar.jpg",
  "bio": "Bio mới của tôi"
}
```
> `displayName` max 100 ký tự. `bio` max 500 ký tự.

**Response 200:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "displayName": "Tên mới",
    "avatar": "https://cdn.example.com/new-avatar.jpg",
    "bio": "Bio mới của tôi",
    "status": "online",
    "lastSeen": "2026-04-15T12:30:00.000Z",
    "createdAt": "2026-04-15T12:00:00.000Z",
    "updatedAt": "2026-04-15T12:35:00.000Z"
  }
}
```

---

### 2.7 Đổi mật khẩu
```http
POST /auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "currentPassword": "123456",
  "newPassword": "654321"
}
```

**Response 200:**
```json
{
  "message": "Password changed successfully"
}
```

> **Quan trọng:** Sau khi đổi mật khẩu thành công, **tất cả session hiện tại đều bị vô hiệu hóa**. FE phải đưa user về màn hình đăng nhập.

**Lỗi thường gặp:**
- `401 Unauthorized` — `currentPassword` không đúng
- `400 Bad Request` — `newPassword` < 6 ký tự

---

### 2.8 Quên mật khẩu
```http
POST /auth/forgot-password
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response 200 (luôn trả 200 kể cả email không tồn tại):**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

> **Lưu ý bảo mật:** API này cố tình không tiết lộ email có tồn tại hay không. FE nên hiển thị thông báo chung: "Nếu email tồn tại, bạn sẽ nhận được liên kết đặt lại mật khẩu."

---

## 3. Gợi ý tích hợp trên Frontend

### 3.1 Axios interceptor mẫu (refresh tự động)
```typescript
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const status = err.response?.status;

    if (status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            original.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken'); // hoặc lấy từ cookie
        const { data } = await axios.post('/auth/refresh', { refreshToken });
        
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        refreshSubscribers.forEach((cb) => cb(data.accessToken));
        refreshSubscribers = [];
        
        original.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        // Refresh thất bại → đăng xuất
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);
```

### 3.2 Gửi request có auth
```typescript
const token = localStorage.getItem('accessToken');

api.get('/auth/profile', {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## 4. Tóm tắt status code

| Code | Ý nghĩa |
|---|---|
| `200 OK` | Thành công (login, logout, refresh, change-password, forgot-password, get profile) |
| `201 Created` | Đăng ký thành công |
| `400 Bad Request` | Dữ liệu không hợp lệ / lỗi hệ thống DB |
| `401 Unauthorized` | Sai credentials, token hết hạn/revoked, sai currentPassword |
| `409 Conflict` | Email đã tồn tại |
| `429 Too Many Requests` | Quá nhiều lần đăng nhập sai (5 lần/giờ/IP) |
