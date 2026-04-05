import { configureStore } from "@reduxjs/toolkit";
import userReducer  from "./slices/userSlice";
import postsReducer from "./slices/postsSlice";
import chatReducer  from "./slices/chatSlice";
import notifReducer from "./slices/notifSlice";

export const store = configureStore({
  reducer: {
    user:  userReducer,
    posts: postsReducer,
    chat:  chatReducer,
    notif: notifReducer,
  },
});
