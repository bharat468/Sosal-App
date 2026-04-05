import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUnreadCounts } from "./redux/slices/notifSlice";
import Layout from "./components/Layout";
import SplashScreen from "./components/SplashScreen";
import PageLoader from "./components/PageLoader";

// ── Lazy-loaded pages ──────────────────────────────────────
const Home         = lazy(() => import("./pages/Home"));
const Search       = lazy(() => import("./pages/Search"));
const Reels        = lazy(() => import("./pages/Reels"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile      = lazy(() => import("./pages/Profile"));
const UserProfile  = lazy(() => import("./pages/UserProfile"));
const Messages     = lazy(() => import("./pages/Messages"));
const CreatePost   = lazy(() => import("./pages/CreatePost"));
const PostDetail   = lazy(() => import("./pages/PostDetail"));
const Login        = lazy(() => import("./pages/Login"));
const Register     = lazy(() => import("./pages/Register"));
const Hashtag      = lazy(() => import("./pages/Hashtag"));
const AdminPanel   = lazy(() => import("./pages/admin/AdminPanel"));

// ── Admin guard ────────────────────────────────────────────
function RequireAuth({ children }) {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    // Normalize stored user id field
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (!u.id && u._id) { u.id = u._id; localStorage.setItem("user", JSON.stringify(u)); }
      } catch { localStorage.removeItem("user"); }
    }
    dispatch(fetchUnreadCounts());
    const interval = setInterval(() => dispatch(fetchUnreadCounts()), 30000);
    return () => clearInterval(interval);
  }, [token, dispatch]);

  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reels"    element={<RequireAuth><Reels /></RequireAuth>} />
          <Route path="/admin/*"  element={<RequireAuth><AdminPanel /></RequireAuth>} />

          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/"                  element={<Home />} />
            <Route path="/search"            element={<Search />} />
            <Route path="/messages"          element={<Messages />} />
            <Route path="/notifications"     element={<Notifications />} />
            <Route path="/profile"           element={<Profile />} />
            <Route path="/profile/:username" element={<UserProfile />} />
            <Route path="/create"            element={<CreatePost />} />
            <Route path="/post/:id"          element={<PostDetail />} />
            <Route path="/hashtag/:tag"      element={<Hashtag />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </>
  );
}
