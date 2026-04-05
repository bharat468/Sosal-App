import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool    = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

// authorId map — seed.mjs se bane users ke usernames
const authorMap = {
  u1: "rahul_sharma",
  u2: "priya_verma",
  u3: "amit_singh",
  u4: "neha_gupta",
  u5: "rohit_yadav",
  u6: "sneha_patel",
  u7: "karan_mehta",
};

const reels = [
  { video_url: "https://www.w3schools.com/html/mov_bbb.mp4",  caption: "Dance vibes 💃🔥",      authorKey: "u1" },
  { video_url: "https://www.w3schools.com/html/movie.mp4",    caption: "Travel reel ✈️🌍",      authorKey: "u2" },
  { video_url: "https://www.w3schools.com/html/mov_bbb.mp4",  caption: "Gym motivation 💪",      authorKey: "u3" },
  { video_url: "https://www.w3schools.com/html/movie.mp4",    caption: "Food lover 😋🍔",        authorKey: "u4" },
  { video_url: "https://www.w3schools.com/html/mov_bbb.mp4",  caption: "Bike ride 🏍️🔥",       authorKey: "u5" },
  { video_url: "https://www.w3schools.com/html/movie.mp4",    caption: "Music mood 🎶",          authorKey: "u6" },
  { video_url: "https://www.w3schools.com/html/mov_bbb.mp4",  caption: "Sunset reel 🌅✨",       authorKey: "u7" },
];

async function seedReels() {
  console.log("🎬 Seeding reels...");

  for (const r of reels) {
    const username = authorMap[r.authorKey];
    const author   = await prisma.user.findUnique({ where: { username } });

    if (!author) {
      console.log(`  ⚠️  User not found: ${username} — run seed.mjs first`);
      continue;
    }

    // Skip if already exists
    const existing = await prisma.post.findFirst({
      where: { authorId: author.id, caption: r.caption, mediaType: "video" },
    });
    if (existing) {
      console.log(`  ⏭  Reel already exists: "${r.caption}"`);
      continue;
    }

    await prisma.post.create({
      data: {
        caption:   r.caption,
        mediaUrl:  r.video_url,
        mediaType: "video",
        authorId:  author.id,
      },
    });
    console.log(`  ✅ Created reel: "${r.caption}" by ${username}`);
  }

  console.log("\n✨ Reels seeded!");
}

seedReels()
  .catch((e) => { console.error("❌ Failed:", e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); pool.end(); });
