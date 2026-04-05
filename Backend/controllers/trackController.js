import Track from "../models/Track.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

// Free tracks — pre-seeded
const FREE_TRACKS = [
  { title: "Chill Vibes",      artist: "Lofi Beats",    genre: "Lofi",    duration: 180, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { title: "Summer Breeze",    artist: "Acoustic Co",   genre: "Acoustic",duration: 210, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { title: "Night Drive",      artist: "Synthwave",     genre: "Electronic",duration: 195, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { title: "Happy Morning",    artist: "Pop Studio",    genre: "Pop",     duration: 165, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { title: "Deep Focus",       artist: "Ambient Lab",   genre: "Ambient", duration: 240, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { title: "Upbeat Energy",    artist: "Dance Floor",   genre: "Dance",   duration: 175, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { title: "Peaceful Garden",  artist: "Nature Sounds", genre: "Ambient", duration: 200, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { title: "City Lights",      artist: "Jazz Cafe",     genre: "Jazz",    duration: 220, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
];

// GET /api/tracks — list all tracks
export const getTracks = async (req, res) => {
  const { q, genre } = req.query;
  let tracks = await Track.find().sort({ createdAt: -1 });

  // Seed if empty
  if (tracks.length === 0) {
    await Track.insertMany(FREE_TRACKS);
    tracks = await Track.find();
  }

  if (q) tracks = tracks.filter((t) =>
    t.title.toLowerCase().includes(q.toLowerCase()) ||
    t.artist.toLowerCase().includes(q.toLowerCase())
  );
  if (genre) tracks = tracks.filter((t) => t.genre === genre);

  res.json(tracks.map((t) => ({ ...t.toObject(), id: t._id })));
};

// POST /api/tracks/upload — upload custom audio
export const uploadTrack = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Audio file required" });
  const { title, artist } = req.body;

  try {
    const result = await uploadToCloudinary(req.file.path, "sosal/audio");
    if (result.isCloud) { try { fs.unlinkSync(req.file.path); } catch {} }

    const track = await Track.create({
      title:  title || req.file.originalname.replace(/\.[^.]+$/, ""),
      artist: artist || req.user.username || "Original",
      url:    result.url,
    });
    res.status(201).json({ ...track.toObject(), id: track._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
