# VinClassroom UI

Nền tảng học tập trực tuyến với giao diện hiện đại, hỗ trợ không gian học tập (Space), phòng chat (Room), và nhắn tin trực tiếp (DM).

## 🚀 Tính năng

- **Space Management**: Tạo và quản lý không gian học tập
- **Room Chat**: Chat theo phòng học với hỗ trợ reply, edit message
- **Direct Messages (DM)**: Nhắn tin trực tiếp giữa các thành viên
- **Theme Toggle**: Chế độ Dark/Light mode
- **Member Management**: Quản lý thành viên, tìm kiếm
- **AI Assistant**: Tích hợp trợ lý AI trong các phòng học
- **Real-time UI**: Giao diện responsive, smooth transitions

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 19, Vite
- **State Management**: Redux Toolkit + React-Redux
- **Styling**: TailwindCSS v4
- **Icons**: React Icons
- **Real-time**: Socket.io Client
- **HTTP Client**: Axios

## 📦 Cài đặt

```bash
# Clone repository
git clone https://github.com/anotherath/vinclassroom-ui.git
cd vinclassroom-ui

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build
```

## 📁 Cấu trúc thư mục

```
src/
├── components/           # React components
│   ├── chatarea/        # Chat area components
│   ├── createspace/     # Create space components
│   ├── memberlist/      # Member list components
│   ├── roomlist/        # Room list components
│   ├── settings/        # Settings components
│   └── sidebar/         # Sidebar components
├── context/             # React Context (legacy)
├── data/                # Mock data
├── services/            # API services
├── store/               # Redux store
│   └── slices/          # Redux slices
│       ├── appSlice.js      # App state (navigation, views)
│       ├── chatSlice.js     # Chat state (reply, edit, selectedUser)
│       ├── memberSlice.js   # Member list state
│       └── themeSlice.js    # Theme state (dark/light)
└── styles/              # Global styles
```

## 🎨 Redux State Management

### App Slice

- `activeView` - View hiện tại (space, messages, createSpace, settings)
- `activeSpace` - Space đang chọn
- `activeRoom` - Room đang chọn
- `searchQuery` - Từ khóa tìm kiếm
- `isSettings` - Trạng thái settings

### Theme Slice

- `isDark` - Dark/Light mode (tự động lưu localStorage)

### Chat Slice

- `replyTo` - Tin nhắn đang reply
- `editMessage` - Tin nhắn đang edit
- `selectedUser` - User được chọn

### Member Slice

- `memberSearchQuery` - Tìm kiếm thành viên
- `selectedMember` - Thành viên được chọn

## 📝 Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Chạy development server  |
| `npm run build`   | Build production         |
| `npm run preview` | Preview production build |
| `npm run lint`    | Chạy ESLint              |

## 👥 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

MIT License

---

Made with ❤️ by VinClassroom Team
