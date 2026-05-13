---
title: 092 User Interface
emoji: 💬
colorFrom: indigo
colorTo: blue
sdk: docker
pinned: false
---

# VinClassroom UI

## Chạy dự án

```bash
# Cài đặt dependencies
npm install

# Chạy dev server
npm run dev

# Build production
npm run build
```

## Cấu hình `.env`

Copy `.env.example` thành `.env` và chỉnh sửa:

```bash
# API backend (REST)
VITE_API_URL=http://localhost:3000/api

# WebSocket (Socket.IO)
VITE_SOCKET_URL=http://localhost:3000
```

> **Lưu ý:** `VITE_SOCKET_URL` để `http://`, không phải `ws://`. Socket.IO client tự động upgrade lên WebSocket.
