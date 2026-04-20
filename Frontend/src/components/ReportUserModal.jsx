import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import toast from "react-hot-toast";
import api from "../api/api";

const REPORT_OPTIONS = [
  { value: "spam", label: "Spam", hint: "Unwanted promotions or repeated junk content." },
  { value: "harassment", label: "Harassment or bullying", hint: "Threats, abuse, or targeted intimidation." },
  { value: "hate_speech", label: "Hate speech", hint: "Attacks based on identity or protected traits." },
  { value: "impersonation", label: "Impersonation", hint: "Pretending to be someone else." },
  { value: "nudity", label: "Nudity or sexual content", hint: "Sexual or explicit material." },
  { value: "violence", label: "Violence", hint: "Graphic harm, threats, or dangerous content." },
  { value: "scam", label: "Scam or fraud", hint: "Deceptive money, giveaway, or phishing behavior." },
  { value: "false_information", label: "False information", hint: "Misleading claims that may cause harm." },
  { value: "other", label: "Other", hint: "Anything else that breaks platform rules." },
];

export default function ReportUserModal({ user, onClose, onSubmitted }) {
  const [category, setCategory] = useState("spam");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const selected = useMemo(
    () => REPORT_OPTIONS.find((option) => option.value === category) || REPORT_OPTIONS[0],
    [category]
  );

  const handleSubmit = async () => {
    if (!user?.id || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/users/${user.id}/report`, {
        category,
        details: details.trim(),
      });
      toast.success(data?.message || "Report submitted successfully.");
      onSubmitted?.();
      onClose?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Unable to submit report.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center bg-black/70 px-3 sm:px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-lg rounded-[28px] overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <div>
              <p className="text-lg font-bold" style={{ color: "var(--t1)", fontFamily: "Sora, sans-serif" }}>
                Report @{user?.username}
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--t3)" }}>
                Tell us what happened. Your report will be saved for admin review.
              </p>
            </div>
            <button onClick={onClose} className="shrink-0" style={{ color: "var(--t3)" }}>
              <IoClose size={22} />
            </button>
          </div>

          <div className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
            {REPORT_OPTIONS.map((option) => {
              const isActive = option.value === category;
              return (
                <button
                  key={option.value}
                  onClick={() => setCategory(option.value)}
                  className="w-full rounded-2xl px-4 py-3 text-left transition-colors"
                  style={{
                    background: isActive ? "rgba(232,68,10,0.14)" : "var(--bg-input)",
                    border: `1px solid ${isActive ? "rgba(232,68,10,0.45)" : "var(--border)"}`,
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: isActive ? "var(--accent)" : "var(--t1)" }}>
                    {option.label}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--t3)" }}>
                    {option.hint}
                  </p>
                </button>
              );
            })}

            <div className="rounded-2xl px-4 py-3" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>
                More details
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--t3)" }}>
                {selected.hint}
              </p>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                placeholder="Add any details that will help the admin understand this report..."
                rows={4}
                className="w-full mt-3 bg-transparent resize-none outline-none text-sm"
                style={{ color: "var(--t1)" }}
              />
              <div className="text-right text-[11px]" style={{ color: "var(--t4)" }}>
                {details.length}/500
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl py-3 text-sm font-semibold"
              style={{ background: "var(--bg-input)", color: "var(--t1)", border: "1px solid var(--border)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="flex-1 rounded-2xl py-3 text-sm font-semibold disabled:opacity-60"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {sending ? "Sending..." : "Submit report"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
