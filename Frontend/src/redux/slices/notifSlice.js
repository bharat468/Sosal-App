import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";

export const fetchNotifications = createAsyncThunk("notif/fetch", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/notifications?limit=30");
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || "Failed");
  }
});

export const fetchUnreadCounts = createAsyncThunk("notif/fetchCounts", async () => {
  try {
    const [notifRes, msgRes] = await Promise.all([
      api.get("/notifications?limit=1"),
      api.get("/messages/conversations"),
    ]);
    const unreadNotifs = notifRes.data.unread ?? 0;
    const unreadMsgs   = (msgRes.data || []).reduce((sum, c) => sum + (c.unread ?? 0), 0);
    return { unreadNotifs, unreadMsgs };
  } catch {
    return { unreadNotifs: 0, unreadMsgs: 0 };
  }
});

export const markAllRead = createAsyncThunk("notif/markAll", async () => {
  await api.put("/notifications/read");
});

export const followFromNotif = createAsyncThunk("notif/follow", async (userId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/users/${userId}/follow`);
    return { userId, following: data.following };
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || "Failed");
  }
});

const notifSlice = createSlice({
  name: "notif",
  initialState: {
    notifications: [],
    unread: 0,
    unreadMsgs: 0,
    loading: false,
  },
  reducers: {
    incrementUnreadMsg: (state) => { state.unreadMsgs += 1; },
    clearUnreadMsg:     (state) => { state.unreadMsgs = 0; },
    incrementUnread:    (state) => { state.unread += 1; },
    clearUnread:        (state) => { state.unread = 0; },
  },
  extraReducers: (b) => {
    b.addCase(fetchNotifications.pending,   (state) => { state.loading = true; });
    b.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.loading = false;
      state.notifications = action.payload.notifications || [];
      state.unread = action.payload.unread ?? 0;
    });
    b.addCase(fetchNotifications.rejected, (state) => { state.loading = false; });

    b.addCase(fetchUnreadCounts.fulfilled, (state, action) => {
      state.unread     = action.payload.unreadNotifs;
      state.unreadMsgs = action.payload.unreadMsgs;
    });

    b.addCase(markAllRead.fulfilled, (state) => {
      state.unread = 0;
      state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
    });
  },
});

export const { incrementUnreadMsg, clearUnreadMsg, incrementUnread, clearUnread } = notifSlice.actions;
export default notifSlice.reducer;
