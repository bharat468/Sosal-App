import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/userSlice";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import api from "../api/api";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";

export default function Login() {
  const [form, setForm]         = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDark } = useTheme();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      dispatch(setUser(data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  const handleGoogle = async (credentialResponse) => {
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/google", { credential: credentialResponse.credential });
      localStorage.setItem("token", data.token);
      dispatch(setUser(data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative"
      style={{ background: "var(--bg-body)" }}>
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="w-full max-w-[360px]">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-[42px] font-bold" style={{ fontFamily: "Sora, sans-serif", color: "var(--t1)", letterSpacing: "-1px" }}>
            Sosal
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--t3)", fontFamily: "DM Sans, sans-serif" }}>
            Connect with the world
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 mb-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>

          {error && (
            <div className="mb-4 text-sm text-center px-3 py-2.5 rounded-lg"
              style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid rgba(226,75,74,0.2)" }}>
              {error}
            </div>
          )}

          {/* Google */}
          <div className="flex justify-center mb-5">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setError("Google login failed")}
              theme={isDark ? "filled_black" : "outline"}
              size="large"
              width="280"
            />
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--t3)", fontFamily: "DM Sans, sans-serif" }}>OR</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" name="email" value={form.email} onChange={handleChange}
              required placeholder="Email" className="app-input" />

            <div className="relative">
              <input type={showPass ? "text" : "password"} name="password" value={form.password}
                onChange={handleChange} required placeholder="Password" className="app-input pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--t3)" }}>
                {showPass ? <BsEyeSlash size={17} /> : <BsEye size={17} />}
              </button>
            </div>

            <motion.button type="submit" whileTap={{ scale: 0.97 }}
              disabled={loading || !form.email || !form.password}
              className="grad-btn w-full py-2.5 rounded-lg text-sm mt-1">
              {loading ? "Logging in..." : "Log in"}
            </motion.button>
          </form>

          <div className="text-center mt-4">
            <Link to="#" className="text-xs" style={{ color: "var(--t3)" }}>Forgot password?</Link>
          </div>
        </div>

        <div className="rounded-xl py-4 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--t1)", fontFamily: "DM Sans, sans-serif" }}>
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold" style={{ color: "var(--accent)" }}>Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
