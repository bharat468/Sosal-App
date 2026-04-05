import { createSlice } from "@reduxjs/toolkit";

// Chat is now handled locally in Messages.jsx
// This slice kept for compatibility
const chatSlice = createSlice({
  name: "chat",
  initialState: { activeChat: null },
  reducers: {
    setActiveChat: (state, action) => { state.activeChat = action.payload; },
    clearChat:     (state)         => { state.activeChat = null; },
  },
});

export const { setActiveChat, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
