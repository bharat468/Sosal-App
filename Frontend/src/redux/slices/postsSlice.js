import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";

export const fetchFeed = createAsyncThunk("posts/fetchFeed", async (page = 1, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/posts/feed?page=${page}&limit=10`);
    return { ...data, page };
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || "Failed");
  }
});

export const createPost = createAsyncThunk("posts/create", async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || "Failed");
  }
});

export const likePost = createAsyncThunk("posts/like", async (postId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/posts/${postId}/like`);
    return { postId, ...data };
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || "Failed");
  }
});

export const deletePost = createAsyncThunk("posts/delete", async (postId, { rejectWithValue }) => {
  try {
    await api.delete(`/posts/${postId}`);
    return postId;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || "Failed to delete");
  }
});

const postsSlice = createSlice({
  name: "posts",
  initialState: {
    posts: [],
    loading: false,
    error: null,
    page: 1,
    hasMore: true,
  },
  reducers: {
    clearPosts: (state) => { state.posts = []; state.page = 1; state.hasMore = true; },
    updateCaption: (state, action) => {
      const post = state.posts.find((p) => (p.id || p._id)?.toString() === action.payload.id?.toString());
      if (post) post.caption = action.payload.caption;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchFeed.pending, (state) => { state.loading = true; state.error = null; });
    b.addCase(fetchFeed.fulfilled, (state, action) => {
      state.loading = false;
      const { posts, page, pages } = action.payload;
      if (page === 1) {
        state.posts = posts;
      } else {
        // Append, avoid duplicates
        const ids = new Set(state.posts.map((p) => p.id || p._id));
        state.posts.push(...posts.filter((p) => !ids.has(p.id || p._id)));
      }
      state.page = page;
      state.hasMore = page < pages;
    });
    b.addCase(fetchFeed.rejected, (state, action) => {
      state.loading = false; state.error = action.payload;
    });

    b.addCase(createPost.fulfilled, (state, action) => {
      const post = { ...action.payload, liked: false, _count: action.payload._count || { likes: 0, comments: 0 } };
      state.posts.unshift(post);
    });

    b.addCase(likePost.fulfilled, (state, action) => {
      const post = state.posts.find((p) => (p.id || p._id)?.toString() === action.payload.postId?.toString());
      if (post) {
        post.liked = action.payload.liked;
        post._count = { ...post._count, likes: action.payload.likes };
      }
    });

    b.addCase(deletePost.fulfilled, (state, action) => {
      state.posts = state.posts.filter((p) => (p.id || p._id)?.toString() !== action.payload?.toString());
    });
  },
});

export const { clearPosts, updateCaption } = postsSlice.actions;
export default postsSlice.reducer;
