import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./slices/appSlice";
import themeReducer from "./slices/themeSlice";
import chatReducer from "./slices/chatSlice";
import memberReducer from "./slices/memberSlice";
import messageReducer from "./slices/messageSlice";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    theme: themeReducer,
    chat: chatReducer,
    member: memberReducer,
    message: messageReducer,
    auth: authReducer,
  },
});
