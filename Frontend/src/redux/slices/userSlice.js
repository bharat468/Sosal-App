import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";

// Load user from localStorage on startup — normalize id field
const stored = localStorage.getItem("user");
let storedUser = null;
if (stored) {
  try {
    const u = JSON.parse(stored);
    storedUser = { ...u, id: u._id || u.id };
  } catch { localStorage.removeItem("user"); }
}

export const fetchMe = createAsyncThunk("user/fetchMe", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/auth/me");
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || "Failed");
  }
});

export const updateProfile = createAsyncThunk("user/updateProfile", async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.put("/users/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || "Failed");
  }
});

const userSlice = createSlice({
  name: "user",
  initialState: {
    currentUser: storedUser,
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      const user = { ...action.payload, id: action.payload._id || action.payload.id };
      state.currentUser = user;
      localStorage.setItem("user", JSON.stringify(user));
    },
    logout: (state) => {
      state.currentUser = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMe.fulfilled, (state, action) => {
      const user = { ...action.payload, id: action.payload._id || action.payload.id };
      state.currentUser = user;
      localStorage.setItem("user", JSON.stringify(user));
    });
    b.addCase(updateProfile.fulfilled, (state, action) => {
      const user = { ...state.currentUser, ...action.payload, id: action.payload._id || action.payload.id || state.currentUser?.id };
      state.currentUser = user;
      localStorage.setItem("user", JSON.stringify(user));
    });
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
