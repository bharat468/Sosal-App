import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { AiOutlinePlus } from "react-icons/ai";
import Avatar from "./Avatar";
import StoryViewer from "./StoryViewer";
import StoryCreate from "./StoryCreate";
import api from "../api/api";

export default function StorySection() {
  const { currentUser } = useSelector((s) => s.user);
  const [groups, setGroups]           = useState([]);
  const [viewerOpen, setViewerOpen]   = useState(false);
  const [startIdx, setStartIdx]       = useState(0);
  const [createOpen, setCreateOpen]   = useState(false);

  const loadStories = () => {
    api.get("/stories/feed").then(({ data }) => setGroups(data)).catch(() => {});
  };

  useEffect(() => { loadStories(); }, []);

  const openViewer = (idx) => { setStartIdx(idx); setViewerOpen(true); };

  const myGroup = groups.find((g) =>
    g.user.id?.toString() === (currentUser?._id || currentUser?.id)?.toString()
  );
  const hasMyStory = !!myGroup;
  const myHasUnread = myGroup?.hasUnread;

  return (
    <>
      <div className="flex gap-4 px-4 py-4 overflow-x-auto scrollbar-hide"
        style={{ borderBottom: "1px solid var(--border-soft)" }}>

        {/* Your story bubble */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          whileTap={{ scale: 0.88 }}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
          onClick={() => hasMyStory ? openViewer(groups.findIndex((g) =>
            g.user.id?.toString() === (currentUser?._id || currentUser?.id)?.toString()
          )) : setCreateOpen(true)}
        >
          <div className="relative">
            <div className="p-[2px] rounded-full"
              style={{ background: hasMyStory ? "linear-gradient(135deg, var(--accent), #FF9A6C, #FFB347)" : "var(--border)" }}>
              <div className="p-[2px] rounded-full" style={{ background: "var(--bg-body)" }}>
                <Avatar src={currentUser?.avatar} name={currentUser?.name} username={currentUser?.username} size={56} />
              </div>
            </div>
            {/* Plus button */}
            <div className="absolute bottom-0 right-0 rounded-full w-[18px] h-[18px] flex items-center justify-center border-2"
              style={{ background: "linear-gradient(135deg, var(--accent), #FF9A6C)", borderColor: "var(--bg-body)" }}>
              <AiOutlinePlus size={10} color="#fff" />
            </div>
          </div>
          <span className="text-[11px] w-16 text-center truncate leading-tight" style={{ color: "var(--t3)" }}>
            {hasMyStory ? "Your story" : "Add story"}
          </span>
        </motion.div>

        {/* Other users' stories */}
        {groups
          .filter((g) => g.user.id?.toString() !== (currentUser?._id || currentUser?.id)?.toString())
          .map((group, i) => {
            const realIdx = groups.findIndex((g) => g.user.id?.toString() === group.user.id?.toString());
            return (
              <motion.div key={group.user.id}
                initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i + 1) * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                whileTap={{ scale: 0.88 }}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                onClick={() => openViewer(realIdx)}
              >
                <div className="p-[2px] rounded-full"
                  style={{
                    background: group.hasUnread
                      ? "linear-gradient(135deg, var(--accent), #FF9A6C, #FFB347)"
                      : "rgba(128,128,128,0.4)",
                  }}>
                  <div className="p-[2px] rounded-full" style={{ background: "var(--bg-body)" }}>
                    <Avatar src={group.user.avatar} name={group.user.name} username={group.user.username} size={56} />
                  </div>
                </div>
                <span className="text-[11px] w-16 text-center truncate leading-tight" style={{ color: "var(--t3)" }}>
                  {group.user.username}
                </span>
              </motion.div>
            );
          })}
      </div>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewerOpen && groups.length > 0 && (
          <StoryViewer
            groups={groups}
            startGroupIdx={startIdx}
            onClose={() => { setViewerOpen(false); loadStories(); }}
          />
        )}
      </AnimatePresence>

      {/* Story Create */}
      <AnimatePresence>
        {createOpen && (
          <StoryCreate
            onClose={() => setCreateOpen(false)}
            onCreated={() => { loadStories(); setCreateOpen(false); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
